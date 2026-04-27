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
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const reference = String(body?.reference || "").trim().toUpperCase();
    const password = String(body?.password || "");
    if (!reference || !password) {
      return new Response(
        JSON.stringify({ error: "بيانات الدخول مطلوبة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Generic error to prevent enumeration
    const genericError = new Response(
      JSON.stringify({ error: "بيانات الدخول غير صحيحة" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

    // Find employee by reference (case-insensitive, also try as-is)
    const { data: emp } = await admin
      .from("employees")
      .select("id, user_id, name, is_active")
      .or(`reference.eq.${reference},reference.eq.${reference.toLowerCase()}`)
      .maybeSingle();

    if (!emp || !emp.is_active || !emp.user_id) {
      return genericError;
    }

    // Fetch the auth user email server-side (never returned to client)
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(emp.user_id);
    if (userErr || !userData?.user?.email) {
      return genericError;
    }

    // Perform sign-in server-side; only the resulting session tokens are returned.
    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (signInErr || !signInData?.session) {
      return genericError;
    }

    return new Response(
      JSON.stringify({
        name: emp.name,
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "بيانات الدخول غير صحيحة" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});