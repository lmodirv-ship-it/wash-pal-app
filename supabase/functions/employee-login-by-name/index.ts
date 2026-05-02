import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const code = String(body?.code || "").trim();

    if (!name || !code) {
      return new Response(JSON.stringify({ error: "الاسم والكود مطلوبان" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find employee by name (case-insensitive) AND matching reference code
    const { data: emps, error: empErr } = await admin
      .from("employees")
      .select("id, user_id, name, reference, shop_id, is_active")
      .ilike("name", name);

    if (empErr) throw empErr;
    const candidates = (emps || []).filter((e: any) =>
      String(e.reference || "").toUpperCase() === code.toUpperCase() ||
      String(e.reference || "").toUpperCase() === `E-${code.toUpperCase().replace(/^E-?/, "")}`
    );

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ error: "الاسم أو الكود غير صحيح" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (candidates.length > 1) {
      return new Response(JSON.stringify({ error: "يوجد أكثر من موظف بنفس الاسم — تواصل مع المدير" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const emp = candidates[0];
    if (!emp.is_active) {
      return new Response(JSON.stringify({ error: "الحساب غير مفعّل" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // The password we'll use for auth = the reference code (full, e.g. E-123456)
    const authPassword = String(emp.reference);
    let userId = emp.user_id as string | null;
    let email: string | null = null;

    if (!userId) {
      // Create auth user with synthetic email
      const safeName = String(emp.name).toLowerCase().replace(/[^a-z0-9]/g, "");
      email = `emp_${safeName || "u"}_${emp.id.slice(0, 6)}@hlavage.local`;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password: authPassword, email_confirm: true,
        user_metadata: { name: emp.name, role: "employee" },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: createErr?.message || "تعذر إنشاء الحساب" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userId = created.user.id;
      await admin.from("employees").update({ user_id: userId }).eq("id", emp.id);
      await admin.from("shop_members").upsert(
        { shop_id: emp.shop_id, user_id: userId, role: "employee" },
        { onConflict: "shop_id,user_id" });
    } else {
      const { data: u } = await admin.auth.admin.getUserById(userId);
      email = u?.user?.email || null;
      // Always sync password to current reference code
      await admin.auth.admin.updateUserById(userId, { password: authPassword });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "تعذر استرجاع البريد" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Sign in server-side and return only tokens (no raw credentials).
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data: signed, error: signErr } = await anon.auth.signInWithPassword({
      email, password: authPassword,
    });
    if (signErr || !signed?.session) {
      return new Response(JSON.stringify({ error: signErr?.message || "تعذر تسجيل الدخول" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({
        access_token: signed.session.access_token,
        refresh_token: signed.session.refresh_token,
        name: emp.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
