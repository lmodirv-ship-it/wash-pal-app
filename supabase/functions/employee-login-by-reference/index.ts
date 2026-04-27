import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const reference = String(body?.reference || "").trim().toUpperCase();
    if (!reference) {
      return new Response(
        JSON.stringify({ error: "reference required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find employee by reference (case-insensitive, also try as-is)
    const { data: emp, error: empErr } = await admin
      .from("employees")
      .select("id, user_id, name, is_active")
      .or(`reference.eq.${reference},reference.eq.${reference.toLowerCase()}`)
      .maybeSingle();

    if (empErr || !emp) {
      return new Response(
        JSON.stringify({ error: "رقم التعريف غير موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!emp.is_active) {
      return new Response(
        JSON.stringify({ error: "الحساب غير مفعّل" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!emp.user_id) {
      return new Response(
        JSON.stringify({ error: "لم يتم تعيين كلمة سر لهذا الموظف بعد. اطلب من المدير إعدادها." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch the auth user to get the email
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(emp.user_id);
    if (userErr || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "تعذّر استرجاع بيانات الدخول" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ email: userData.user.email, name: emp.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});