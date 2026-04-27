import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { face_image, action } = await req.json();

    // SECURITY: require authenticated admin session for all actions.
    // No public email lookup, no email enumeration, no magic-link tokens returned.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string | undefined)?.toLowerCase() || "";

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, face_photo")
      .eq("user_id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "هذا الحساب ليس حساب مدير" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: check (now safe — only the signed-in admin can query their own status)
    if (action === "check") {
      return new Response(
        JSON.stringify({ isAdmin: true, hasPhoto: !!profile.face_photo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: register face — only the admin themselves, while signed in
    if (action === "register") {
      if (!face_image) {
        return new Response(
          JSON.stringify({ error: "لم يتم التقاط صورة" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin
        .from("profiles")
        .update({ face_photo: face_image })
        .eq("id", profile.id);

      // Do NOT return any login token. Admin already has a valid session.
      return new Response(
        JSON.stringify({ success: true, message: "تم تسجيل الوجه بنجاح" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: verify face — confirms the signed-in admin's face matches.
    if (action === "verify") {
      if (!face_image) {
        return new Response(
          JSON.stringify({ error: "لم يتم التقاط صورة" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!profile.face_photo) {
        return new Response(
          JSON.stringify({ error: "لم يتم تسجيل وجه المدير بعد. يرجى التسجيل أولاً" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // AI face comparison
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Compare these two face photos. Are they the SAME person? Reply ONLY with 'YES' or 'NO'. Photo 1 is the registered admin face. Photo 2 is the current camera capture. Be strict but reasonable."
                },
                { type: "image_url", image_url: { url: profile.face_photo } },
                { type: "image_url", image_url: { url: face_image } }
              ]
            }
          ],
          max_tokens: 10,
        }),
      });

      const aiResult = await aiResponse.json();
      const answer = aiResult.choices?.[0]?.message?.content?.trim()?.toUpperCase() || "";
      const isMatch = answer.includes("YES");

      if (!isMatch) {
        // Store intruder photo in login_attempts table
        try {
          await supabaseAdmin
            .from("login_attempts")
            .insert({
              admin_email: email,
              intruder_photo: face_image,
              ip_address: req.headers.get("x-forwarded-for") || "unknown",
            });
        } catch (e) {
          console.error("Failed to store intruder photo:", e);
        }

        return new Response(
          JSON.stringify({ error: "التحقق فشل - الوجه غير مطابق. تم حفظ صورة المتسلل.", verified: false }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Face matched. The admin is already authenticated by JWT;
      // we never return raw login tokens to the client.
      return new Response(
        JSON.stringify({ verified: true, message: "تم التحقق بنجاح" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "إجراء غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
