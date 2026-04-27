import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResp({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user?.id) return jsonResp({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;
    const callerEmail = userData.user.email ?? null;

    const admin = createClient(supabaseUrl, serviceKey);

    // owner-only
    const { data: roleCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "owner");
    if (!roleCheck?.length) return jsonResp({ error: "Forbidden — owner only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action ?? "list";

    // ---- LIST: returns recent users with last_sign_in_at + has active session indicator ----
    if (action === "list") {
      const page = Math.max(1, Number(body?.page ?? 1));
      const perPage = Math.min(100, Math.max(20, Number(body?.perPage ?? 50)));
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const userIds = data.users.map((u) => u.id);
      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, name, role")
        .in("user_id", userIds);
      const profMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      const now = Date.now();
      const sessions = data.users.map((u) => {
        const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
        // Heuristic: consider "active" if signed in within last 24h
        const activeRecent = lastSignIn > 0 && now - lastSignIn < 24 * 60 * 60 * 1000;
        const p = profMap.get(u.id);
        return {
          user_id: u.id,
          email: u.email,
          name: p?.name ?? null,
          role: p?.role ?? null,
          last_sign_in_at: u.last_sign_in_at,
          created_at: u.created_at,
          active_recent: activeRecent,
        };
      });

      return jsonResp({ sessions, page, perPage, total: data.users.length });
    }

    // ---- LOGOUT (single) ----
    if (action === "logout") {
      const targetId: string | undefined = body?.user_id;
      if (!targetId) return jsonResp({ error: "user_id required" }, 400);

      // Protect: cannot force-logout self silently — allow but log clearly
      const { error } = await admin.auth.admin.signOut(targetId, "global");
      if (error) throw error;

      const { data: targetUser } = await admin.auth.admin.getUserById(targetId);

      await admin.from("audit_logs").insert({
        actor_user_id: callerId,
        actor_email: callerEmail,
        action: "owner.force_logout",
        target_type: "user",
        target_id: targetId,
        new_value: { email: targetUser?.user?.email ?? null, scope: "global" },
        metadata: { source: "owner-sessions" },
      });

      return jsonResp({ ok: true, user_id: targetId });
    }

    // ---- LOGOUT_ALL (mass) ----
    if (action === "logout_all") {
      const userIds: string[] = Array.isArray(body?.user_ids) ? body.user_ids : [];
      if (!userIds.length) return jsonResp({ error: "user_ids required" }, 400);

      const results: { user_id: string; ok: boolean; error?: string }[] = [];
      for (const uid of userIds) {
        try {
          const { error } = await admin.auth.admin.signOut(uid, "global");
          if (error) throw error;
          results.push({ user_id: uid, ok: true });
        } catch (e) {
          results.push({ user_id: uid, ok: false, error: (e as Error).message });
        }
      }

      await admin.from("audit_logs").insert({
        actor_user_id: callerId,
        actor_email: callerEmail,
        action: "owner.force_logout_bulk",
        target_type: "user",
        target_id: `${userIds.length}_users`,
        new_value: { user_ids: userIds, scope: "global" },
        metadata: {
          source: "owner-sessions",
          succeeded: results.filter((r) => r.ok).length,
          failed: results.filter((r) => !r.ok).length,
        },
      });

      return jsonResp({ ok: true, results });
    }

    return jsonResp({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResp({ error: (e as Error).message }, 500);
  }
});
