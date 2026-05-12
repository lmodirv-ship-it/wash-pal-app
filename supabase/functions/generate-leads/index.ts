// Edge function: generate-leads
// Uses Lovable AI Gateway to find car wash businesses worldwide and return structured contact info.
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
    // Require authenticated owner/admin — this triggers expensive AI calls.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub)
      .in("role", ["owner", "admin"]);
    if (!roleRows?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { country, city, count } = await req.json().catch(() => ({}));
    const targetCount = Math.min(Math.max(Number(count) || 10, 1), 100);
    const where =
      country && country !== "world"
        ? `in ${city ? city + ", " : ""}${country}`
        : `from various countries around the world (mix continents: Europe, Africa, Middle East, Asia, Americas)`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt =
      "You are a B2B lead-research assistant. Return ONLY real car wash / auto-detailing businesses that have a verifiable public EMAIL address. Skip any business without a real email. Email is mandatory — never invent emails. Output ONLY via the tool.";

    const userPrompt = `List ${targetCount} car wash businesses ${where} that have a public email address. Every entry MUST include a valid email. Fields: name, owner_name, email (REQUIRED, real), whatsapp (with +), phone, city, country, address, website, notes.`;

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
                  required: ["name", "email", "city", "country"],
                  additionalProperties: false,
              },
            },
          },
          required: ["leads"],
          additionalProperties: false,
        },
      },
    };

    const t0 = Date.now();
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_leads" } },
      }),
    });
    console.log(`AI responded in ${Date.now() - t0}ms`);

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
    // Filter: keep only entries with a plausible email
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    leads = leads.filter((l: any) => l && typeof l.email === "string" && emailRe.test(l.email.trim()));

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
