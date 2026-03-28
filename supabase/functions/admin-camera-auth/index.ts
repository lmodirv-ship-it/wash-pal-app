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
    const { email, face_image, action } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if this email belongs to an admin
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users?.users?.find((u) => u.email === email);

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: "المستخدم غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check profile role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role, face_photo")
      .eq("user_id", adminUser.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "هذا الحساب ليس حساب مدير" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: check if admin email
    if (action === "check") {
      return new Response(
        JSON.stringify({ isAdmin: true, hasPhoto: !!profile.face_photo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: register face (first time)
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

      // Generate session for admin
      const { data: session, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

      // Use signInWithPassword approach - set a temp password
      // Actually, use admin API to create session
      const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "تم تسجيل الوجه بنجاح",
          // Return user info for client-side session
          user_id: adminUser.id,
          token: tokenData?.properties?.hashed_token
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: verify face
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

      // Use Lovable AI to compare faces
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
                  text: "Compare these two face photos. Are they the SAME person? Reply ONLY with 'YES' or 'NO'. Photo 1 is the registered admin face. Photo 2 is the current camera capture. Be strict but reasonable - same person even with slight angle/lighting differences should be YES."
                },
                {
                  type: "image_url",
                  image_url: { url: profile.face_photo }
                },
                {
                  type: "image_url",
                  image_url: { url: face_image }
                }
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
        return new Response(
          JSON.stringify({ error: "التحقق فشل - الوجه غير مطابق", verified: false }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Face matched! Generate magic link for admin sign-in
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (linkError) {
        return new Response(
          JSON.stringify({ error: "خطأ في إنشاء جلسة الدخول" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          verified: true, 
          message: "تم التحقق بنجاح",
          token: linkData?.properties?.hashed_token,
          action_link: linkData?.properties?.action_link,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "إجراء غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
