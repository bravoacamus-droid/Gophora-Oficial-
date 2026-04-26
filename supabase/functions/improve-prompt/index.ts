// GOPHORA — improve-prompt
// Takes a draft prompt the user wrote and rewrites it using prompt-engineering
// best practices (clear role, concrete context, explicit output format,
// constraints, examples). Returns the improved prompt + a one-line reason
// so the UI can show a side-by-side "your version vs improved version" diff.
//
// Uses the Lovable/Groq gateway with Llama 3.3 70B and strict tool-calling so
// the JSON shape is deterministic. Same auth + corsHeaders pattern as the
// other Edge Functions in the project.

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

    const { draft, skill, language } = await req.json();
    if (!draft || typeof draft !== "string" || draft.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Draft is too short (need at least 10 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isEs = language === "es" || language === undefined;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a senior prompt engineer for the GOPHORA AI Toolkit. Your job is to rewrite a user's draft prompt so it consistently produces high-quality output, while preserving the user's original intent.

Rewrite according to these rules:
1) Open with a clear ROLE for the AI ("Actuá como...", "Act as...").
2) Restate the TASK in one sentence.
3) Spell out the CONTEXT the AI needs as a bullet list with [PLACEHOLDERS] for the user to fill in.
4) Specify the OUTPUT FORMAT exactly (table, JSON, numbered list, length, tone).
5) Add 1-2 explicit CONSTRAINTS (what NOT to do, what to avoid, anti-clichés).
6) Keep it concise — no preamble, no "let me know if you want more", no filler.
7) Match the language the user wrote in. If the draft is Spanish, improve it in Spanish. If English, in English.

Always respond using the rewrite_prompt tool. Never reply with prose.`;

    const userPrompt = isEs
      ? `Skill objetivo: ${skill || "(no especificada)"}.\nReescribí este prompt para que rinda mucho mejor:\n\n"""\n${draft}\n"""`
      : `Target skill: ${skill || "(unspecified)"}.\nRewrite this prompt so it performs much better:\n\n"""\n${draft}\n"""`;

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rewrite_prompt",
              description: "Return the improved prompt and a one-line reason in the user's language.",
              parameters: {
                type: "object",
                properties: {
                  improved: {
                    type: "string",
                    description: "The improved version of the prompt. Should preserve user's intent.",
                  },
                  reason: {
                    type: "string",
                    description: "One-line reason explaining the most important change (max 140 chars).",
                  },
                },
                required: ["improved", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await aiResponse.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not use the rewrite_prompt tool");
    }

    const args = JSON.parse(toolCall.function.arguments);
    const improved = String(args.improved || "").trim();
    const reason = String(args.reason || "").trim();

    if (!improved) throw new Error("AI returned an empty rewrite");

    return new Response(
      JSON.stringify({ improved, reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
