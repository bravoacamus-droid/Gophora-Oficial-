import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { missions, budget, projectTitle, projectDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const commissionRate = 0.10;
    const availableBudget = Math.floor(budget / (1 + commissionRate));

    const missionsList = missions.map((m: any, i: number) => 
      `${i + 1}. "${m.title}" - ${m.skill} - ${m.hours}h @ $${m.hourlyRate}/hr = $${m.reward}`
    ).join("\n");

    const systemPrompt = `You are GOPHORA's AI Budget Optimizer. Given a list of missions and a budget constraint, you must select the most important missions that fit within the budget.

RULES:
- Available talent budget (after 10% commission) is $${availableBudget} USD
- Select missions by priority: which ones are most critical to deliver value for the project
- The total reward of selected missions must NOT exceed $${availableBudget}
- Return ONLY the indices (0-based) of the missions to KEEP
- Consider the project context to prioritize correctly
- Prefer missions that form a complete deliverable over scattered tasks

You MUST respond using the select_missions tool.`;

    const userPrompt = `Project: "${projectTitle}"
Description: ${projectDescription}
Total Budget: $${budget} (includes 10% commission)
Available for Talent: $${availableBudget}

Current missions (total exceeds budget):
${missionsList}

Select the most important missions that fit within the $${availableBudget} talent budget. Prioritize missions that deliver the most value.`;

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
              name: "select_missions",
              description: "Return indices of missions to keep within budget",
              parameters: {
                type: "object",
                properties: {
                  kept_indices: {
                    type: "array",
                    items: { type: "number" },
                    description: "0-based indices of missions to keep",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why these missions were prioritized",
                  },
                },
                required: ["kept_indices", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "select_missions" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI optimization failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ 
      kept_indices: args.kept_indices,
      reasoning: args.reasoning,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimize-missions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
