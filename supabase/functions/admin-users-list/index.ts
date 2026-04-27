import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    // Service-role client for elevated reads
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, Number(body?.page ?? 1));
    const perPage = Math.min(50, Math.max(20, Number(body?.perPage ?? 50)));

    // Check owner/admin role
    const { data: roleCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["owner", "admin"]);
    if (!roleCheck?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List users from auth + merge with profiles
    const { data: usersList, error: listErr } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (listErr) throw listErr;

    const userIds = usersList.users.map((u) => u.id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, name, role")
      .in("user_id", userIds);
    const { data: rolesData } = await admin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);
    const { data: employeesData } = await admin
      .from("employees")
      .select("user_id, reference")
      .in("user_id", userIds)
      .not("reference", "is", null);

    const profileByUser = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    const rolesByUser = new Map<string, string[]>();
    rolesData?.forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const referenceByUser = new Map(
      employeesData?.filter((e) => e.user_id).map((e) => [e.user_id, e.reference]) ?? [],
    );

    const result = usersList.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      name: profileByUser.get(u.id)?.name ?? "",
      profile_role: profileByUser.get(u.id)?.role ?? "employee",
      roles: rolesByUser.get(u.id) ?? [],
      reference: referenceByUser.get(u.id) ?? null,
    }));

    return new Response(JSON.stringify({ users: result, total: usersList.total ?? result.length, page, perPage }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});