// Edge function: generate-leads
// Uses Lovable AI Gateway to find car wash businesses worldwide and return structured contact info.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { country, city, count } = await req.json().catch(() => ({}));
    const targetCount = Math.min(Math.max(Number(count) || 10, 1), 30);
    const where =
      country && country !== "world"
        ? `in ${city ? city + ", " : ""}${country}`
        : `from various countries around the world (mix continents: Europe, Africa, Middle East, Asia, Americas)`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt =
      "You are a B2B lead-research assistant. Return ONLY real, publicly listed car-wash / auto-detailing businesses with verifiable public contact info. Never invent emails or phones. If a field is unknown, leave it empty string. Output via the provided tool only.";

    const userPrompt = `Find ${targetCount} real car wash / auto detailing businesses ${where}. For each, provide: business name, owner or manager name (if public), public email, WhatsApp number (international format with +), phone, city, country, full address, website, and a 1-line note about the business.`;

    const tool = {
      type: "function",
      function: {
        name: "return_leads",
        description: "Return a list of car wash business leads.",
        parameters: {
          type: "object",
          properties: {
            leads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  owner_name: { type: "string" },
                  email: { type: "string" },
                  whatsapp: { type: "string" },
                  phone: { type: "string" },
                  city: { type: "string" },
                  country: { type: "string" },
                  address: { type: "string" },
                  website: { type: "string" },
                  notes: { type: "string" },
                },
                required: ["name", "city", "country"],
                additionalProperties: false,
              },
            },
          },
          required: ["leads"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_leads" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح. حاول لاحقاً." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "الرصيد غير كافٍ. يرجى إضافة رصيد لـ Lovable AI." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      throw new Error(`AI gateway error ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    let leads: any[] = [];
    if (args) {
      try {
        const parsed = typeof args === "string" ? JSON.parse(args) : args;
        leads = parsed.leads || [];
      } catch (e) {
        console.error("Parse error:", e);
      }
    }

    return new Response(JSON.stringify({ leads }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-leads error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
