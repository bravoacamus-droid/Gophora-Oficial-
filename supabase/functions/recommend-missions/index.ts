// GOPHORA — recommend-missions
// Ranks open marketplace missions for a given explorer using their Skill
// Passport data (verified skills + level, completed courses, exam pass rate,
// mission history, readiness score) via the Lovable/Groq AI gateway.
//
// Follows the same pattern as recommend-courses: tool-calling with a strict
// schema so the response is deterministic. Client calls via
// supabase.functions.invoke('recommend-missions') — no parameters needed; the
// authenticated user is inferred from the JWT.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Resolve explorer_profiles.id (different from auth.user.id in some setups).
    const { data: explorerProfile } = await supabase
      .from("explorer_profiles")
      .select("id, skills")
      .eq("user_id", user.id)
      .maybeSingle();

    const explorerProfileId = explorerProfile?.id || user.id;

    // Parallel data gather — passport inputs + open missions + already taken
    // assignments so we can exclude them from recommendations.
    const [
      skillsRes,
      coursesRes,
      examsRes,
      completedMissionsRes,
      takenRes,
      openMissionsRes,
    ] = await Promise.all([
      supabase.from("explorer_skills").select("skill_name, skill_level, category").eq("explorer_id", user.id),
      supabase.from("explorer_course_progress").select("course_id").eq("user_id", user.id).eq("completed", true),
      supabase.from("explorer_exam_attempts").select("score, passed").eq("explorer_id", user.id),
      supabase.from("mission_assignments").select("id").eq("explorer_id", explorerProfileId).in("status", ["approved", "paid"]),
      supabase.from("mission_assignments").select("mission_id").eq("explorer_id", explorerProfileId),
      supabase
        .from("missions")
        .select("id, title, title_es, description, description_es, skill, hours, hourly_rate, reward, status, project_id, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const passportSkills = skillsRes.data || [];
    const coursesCompleted = (coursesRes.data || []).length;
    const examAttempts = examsRes.data || [];
    const examsPassed = examAttempts.filter((e: any) => e.passed).length;
    const avgExamScore = examAttempts.length > 0
      ? Math.round(examAttempts.reduce((s: number, e: any) => s + (e.score || 0), 0) / examAttempts.length)
      : 0;
    const missionsCompleted = (completedMissionsRes.data || []).length;
    const takenIds = new Set((takenRes.data || []).map((a: any) => a.mission_id));
    const openMissions = (openMissionsRes.data || []).filter((m: any) => !takenIds.has(m.id));

    if (openMissions.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Profile skills fallback — the explorer_profiles.skills array is filled
    // during onboarding before any explorer_skills row exists.
    const profileSkillsList: string[] = Array.isArray(explorerProfile?.skills)
      ? (explorerProfile!.skills as string[])
      : [];

    const skillSummary = passportSkills.length > 0
      ? passportSkills.map((s: any) => `${s.skill_name}(L${s.skill_level},${s.category || "general"})`).join(", ")
      : profileSkillsList.join(", ") || "No verified skills yet";

    // Readiness score mirrors the client-side calculation in useSkillPassport.
    const courseScore = Math.min((coursesCompleted / 5) * 100, 100);
    const skillScore = Math.min(passportSkills.length * 15, 100);
    const missionScore = Math.min(missionsCompleted * 10, 100);
    const readinessScore = Math.round(
      courseScore * 0.25 + skillScore * 0.25 + avgExamScore * 0.25 + missionScore * 0.25,
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are GOPHORA's mission matching engine. Given an Explorer's Skill Passport, rank the most suitable open missions they should take next.

EXPLORER PROFILE
- Verified skills: ${skillSummary}
- Completed courses: ${coursesCompleted}
- Exams passed: ${examsPassed} (avg score: ${avgExamScore})
- Missions already completed: ${missionsCompleted}
- Mission readiness score: ${readinessScore}/100

OPEN MISSIONS (not yet taken by this explorer):
${openMissions.slice(0, 30).map((m: any, i: number) => `${i}. [${m.id}] "${m.title_es || m.title}" — skill: ${m.skill} — hours: ${m.hours} — reward: $${m.reward}`).join("\n")}

Select the top 6 missions BEST matched for this explorer. Prioritize:
1. Missions whose required skill matches the explorer's verified skills (exact or semantic match)
2. Missions whose hours/complexity fit the explorer's readiness — beginners should NOT be pushed to long high-reward missions they might fail
3. Mix of reward levels so the explorer has quick wins + stretch options
4. Avoid recommending more than 3 missions with the same skill; favour diversity

Return a short reason in both English and Spanish explaining WHY each mission is a good fit.`;

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a mission matching engine. Always respond using the provided tool." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_missions",
            description: "Return recommended mission IDs with reasons and a relevance score.",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      mission_id: { type: "string", description: "UUID of the mission from the provided list" },
                      reason: { type: "string", description: "Brief fit reason in English (max 120 chars)" },
                      reason_es: { type: "string", description: "Brief fit reason in Spanish (max 120 chars)" },
                      relevance_score: { type: "number", description: "Relevance score from 1 to 100" },
                    },
                    required: ["mission_id", "reason", "reason_es", "relevance_score"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let recommendations: any[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      recommendations = parsed.recommendations || [];
    }

    // Enrich with mission + project data so the client doesn't need a second round-trip.
    const missionMap = new Map(openMissions.map((m: any) => [m.id, m]));
    const validRecs = recommendations.filter((r: any) => missionMap.has(r.mission_id));

    const projectIds = [...new Set(validRecs.map((r: any) => missionMap.get(r.mission_id)?.project_id).filter(Boolean))];
    const projectMap = new Map<string, any>();
    if (projectIds.length > 0) {
      const { data: projectRows } = await supabase
        .from("projects")
        .select("id, title, category, video_link, deadline, created_at")
        .in("id", projectIds as string[]);
      (projectRows || []).forEach((p: any) => projectMap.set(p.id, p));
    }

    const enriched = validRecs.map((r: any) => {
      const mission: any = missionMap.get(r.mission_id);
      const project = mission ? projectMap.get(mission.project_id) : null;
      return {
        mission_id: r.mission_id,
        reason: r.reason,
        reason_es: r.reason_es,
        relevance_score: r.relevance_score,
        mission: {
          id: mission.id,
          title: mission.title,
          title_es: mission.title_es,
          description: mission.description,
          description_es: mission.description_es,
          skill: mission.skill,
          hours: Number(mission.hours),
          hourly_rate: Number(mission.hourly_rate),
          reward: Number(mission.reward),
          project_id: mission.project_id,
        },
        project: project
          ? {
              title: project.title,
              category: project.category,
              video_link: project.video_link,
              deadline: project.deadline,
              created_at: project.created_at,
            }
          : null,
      };
    });

    return new Response(
      JSON.stringify({
        recommendations: enriched,
        readiness_score: readinessScore,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
