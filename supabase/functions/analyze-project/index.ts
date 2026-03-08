import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, budget, priority } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are GOPHORA's AI Mission Architect. You analyze projects and break them down into executable micro-missions.

RULES:
- Minimum hourly rate is $20 USD
- GOPHORA charges a 10% commission on top of talent costs
- The client's total budget (including commission) is $${budget} USD
- Available talent budget (after 10% commission) = $${Math.floor(budget / 1.10)} USD
- Each mission must have realistic hour estimates
- Skills must be one of: Marketing, Web Development, Design, Data, Research, Operations
- Break the project into ALL necessary missions — be thorough and complete
- For complex projects, create as many missions as needed (10, 20, 30+)
- Each mission should be atomic: one clear deliverable
- Estimate hours realistically (1-40 hours per mission)
- Calculate reward as: hours × hourly_rate (minimum $20/hr)
- Try to distribute the available budget across missions proportionally to complexity
- If the budget is insufficient for all missions at $20/hr minimum, still list all missions but flag it

You MUST respond using the suggest_missions tool.`;

    const userPrompt = `Project Title: ${title}
Category: ${category}
Priority: ${priority}
Description: ${description}
Total Budget: $${budget} USD (includes 10% GOPHORA commission)
Available for Talent: $${Math.floor(budget / 1.10)} USD

Analyze this project completely. Identify every module, phase, and task needed. Break it into atomic micro-missions. Be thorough — if this is a full project, generate all necessary missions even if there are many.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_missions",
              description: "Return the list of micro-missions for the project",
              parameters: {
                type: "object",
                properties: {
                  missions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Mission title - clear and actionable" },
                        description: { type: "string", description: "Brief description of deliverables" },
                        skill: { type: "string", enum: ["Marketing", "Web Development", "Design", "Data", "Research", "Operations"] },
                        hours: { type: "number", description: "Estimated hours to complete (1-40)" },
                        hourly_rate: { type: "number", description: "Hourly rate in USD (minimum 20)" },
                      },
                      required: ["title", "description", "skill", "hours", "hourly_rate"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["missions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_missions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured missions" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    
    // Enforce minimum $20/hr and recalculate rewards
    const missions = args.missions.map((m: any) => ({
      title: m.title,
      description: m.description,
      skill: m.skill,
      hours: Math.max(1, Math.round(m.hours)),
      hourlyRate: Math.max(20, Math.round(m.hourly_rate)),
      reward: Math.max(1, Math.round(m.hours)) * Math.max(20, Math.round(m.hourly_rate)),
    }));

    return new Response(JSON.stringify({ missions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-project error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
