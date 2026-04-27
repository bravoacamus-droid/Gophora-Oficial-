import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, brief, industry, current_budget, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const isEs = language === "es";

    const systemPrompt = `You are GOPHORA's AI Investment Quoter. A company is preparing a project to present to investors. Your job is to estimate the realistic total cost in USD to fully execute it, and recommend how much of that cost they should ask from investors versus self-fund.

RULES:
- Costs include: talent (paid via GOPHORA missions at $20+/hr), tooling (AI APIs, SaaS), creative assets, integrations, QA, contingency (10%).
- Output is in USD, rounded to the nearest $50.
- Justify the estimate with a 3-5 line rationale citing the main cost drivers — do NOT mention exact hours per phase, just the headline drivers.
- Recommend funding_percent_sought as one of {10, 25, 50}. Pick the tier based on:
   * 10% — small project (<$2,000 estimate) or company already has the budget.
   * 25% — medium project ($2,000-$10,000) or company wants a strategic partner.
   * 50% — large/risky project (>$10,000) or company explicitly says "lots of capital needed".
- Equity offered is fixed by GOPHORA: 10%→5%, 25%→10%, 50%→15%. You do NOT pick equity, just the funding tier.
- Industry must be one of: SaaS, E-commerce, Marketing, Content, Education, FinTech, HealthTech, AI/Tools, Hardware, Other. Pick the closest match.

Return your response via the propose_quote tool.`;

    const userPrompt = `Project Title: ${title}
${description ? `Description: ${description}\n` : ''}${brief ? `Brief: ${brief}\n` : ''}${industry ? `Suggested industry: ${industry}\n` : ''}${current_budget ? `Company indicated budget: $${current_budget}\n` : ''}
Estimate the realistic full execution cost and pick a funding tier (10/25/50). Output in ${isEs ? "Spanish" : "English"} prose for the justification.`;

    const tools = [{
      type: "function",
      function: {
        name: "propose_quote",
        description: "Return the project cost estimate, funding recommendation, and rationale.",
        parameters: {
          type: "object",
          properties: {
            cost_estimate_usd: { type: "number", description: "Total realistic cost to execute end-to-end, USD." },
            justification: { type: "string", description: "3-5 line rationale citing the main cost drivers. Match the requested language." },
            funding_percent_sought: { type: "integer", enum: [10, 25, 50], description: "Recommended % of cost to raise from investors." },
            industry: { type: "string", description: "One of: SaaS, E-commerce, Marketing, Content, Education, FinTech, HealthTech, AI/Tools, Hardware, Other." },
            cost_breakdown: {
              type: "array",
              description: "Top 3-5 cost components (label + amount in USD).",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  amount_usd: { type: "number" },
                },
                required: ["label", "amount_usd"],
              },
            },
          },
          required: ["cost_estimate_usd", "justification", "funding_percent_sought", "industry", "cost_breakdown"],
        },
      },
    }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "propose_quote" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      return jsonResponse({ error: `AI gateway returned ${aiRes.status}` }, 502);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return jsonResponse({ error: "No tool call in AI response" }, 502);

    let args: any;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return jsonResponse({ error: "AI returned malformed arguments" }, 502);
    }

    // Map funding_percent_sought → equity_offered_percent (GOPHORA's fixed ladder)
    const equityLadder: Record<number, number> = { 10: 5, 25: 10, 50: 15 };
    const equity_offered_percent = equityLadder[args.funding_percent_sought] ?? 0;

    return jsonResponse({
      cost_estimate_usd: Math.round(Number(args.cost_estimate_usd || 0) / 50) * 50,
      justification: String(args.justification || ""),
      funding_percent_sought: Number(args.funding_percent_sought || 0),
      equity_offered_percent,
      industry: String(args.industry || "Other"),
      cost_breakdown: Array.isArray(args.cost_breakdown) ? args.cost_breakdown : [],
    });
  } catch (err) {
    console.error("quote-project error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
