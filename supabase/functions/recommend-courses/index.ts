import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Fetch explorer data in parallel
    const [skillsRes, progressRes, coursesRes, missionsRes] = await Promise.all([
      supabase.from("explorer_skills").select("skill_name, skill_level").eq("explorer_id", user.id),
      supabase.from("explorer_course_progress").select("course_id").eq("user_id", user.id).eq("completed", true),
      supabase.from("academy_courses").select("id, title, title_es, description, skills_learned, skill_level, category, views_count, rating, instructor_name").eq("course_status", "published"),
      supabase.from("missions").select("id, title, skill, status").eq("status", "open"),
    ]);

    const skills = skillsRes.data || [];
    const completedIds = new Set((progressRes.data || []).map((p: any) => p.course_id));
    const allCourses = (coursesRes.data || []).filter((c: any) => !completedIds.has(c.id));
    const missions = missionsRes.data || [];

    if (allCourses.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a course recommendation engine for GOPHORA platform.

Explorer's current skills: ${skills.map((s: any) => `${s.skill_name} (level ${s.skill_level})`).join(", ") || "None yet"}
Completed courses: ${completedIds.size}
Available missions requiring skills: ${missions.map((m: any) => `"${m.title}" needs ${m.skill}`).join("; ") || "None"}

Available courses (not yet completed):
${allCourses.slice(0, 30).map((c: any, i: number) => `${i}. [${c.id}] "${c.title}" - Skills: ${(c.skills_learned || []).join(", ")} - Level: ${c.skill_level} - Rating: ${c.rating} - Views: ${c.views_count}`).join("\n")}

Select the top 6 most relevant courses for this explorer. Prioritize:
1. Courses that teach skills needed for available missions
2. Courses that build on existing skills
3. Higher rated and popular courses
4. Courses that fill skill gaps`;

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a course recommendation engine." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_courses",
            description: "Return recommended course IDs with reasons",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      course_id: { type: "string" },
                      reason: { type: "string", description: "Brief reason in English" },
                      reason_es: { type: "string", description: "Brief reason in Spanish" },
                      relevance_score: { type: "number", description: "1-100 relevance score" },
                    },
                    required: ["course_id", "reason", "reason_es", "relevance_score"],
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

    // Enrich with course data
    const courseMap = new Map(allCourses.map((c: any) => [c.id, c]));
    const enriched = recommendations
      .filter((r: any) => courseMap.has(r.course_id))
      .map((r: any) => ({
        ...r,
        course: courseMap.get(r.course_id),
      }));

    return new Response(JSON.stringify({ recommendations: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend-courses error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
