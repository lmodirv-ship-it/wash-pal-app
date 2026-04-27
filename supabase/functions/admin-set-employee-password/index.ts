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

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller client (uses caller JWT to verify identity & RLS context)
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { employee_id, new_password, email } = body as {
      employee_id?: string;
      new_password?: string;
      email?: string;
    };

    if (!employee_id || !new_password || new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "employee_id and new_password (min 6) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Service-role client for privileged actions
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Load employee row
    const { data: emp, error: empErr } = await admin
      .from("employees")
      .select("id, shop_id, user_id, name, phone")
      .eq("id", employee_id)
      .maybeSingle();
    if (empErr || !emp) {
      return new Response(JSON.stringify({ error: "Employee not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a manager of this shop OR platform owner
    const { data: canManage } = await callerClient.rpc("is_shop_manager", {
      _shop_id: emp.shop_id,
    });
    const { data: isOwnerData } = await callerClient.rpc("is_owner");
    if (!canManage && !isOwnerData) {
      return new Response(JSON.stringify({ error: "Not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = emp.user_id as string | null;

    // If employee has no auth user yet, create one (email required)
    if (!targetUserId) {
      const useEmail = (email && email.trim()) ||
        `emp_${emp.id.slice(0, 8)}@hlavage.local`;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: useEmail,
        password: new_password,
        email_confirm: true,
        user_metadata: { name: emp.name, role: "employee" },
      });
      if (createErr || !created.user) {
        return new Response(
          JSON.stringify({ error: createErr?.message || "Failed to create auth user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      targetUserId = created.user.id;

      // Link employee row & shop_members
      await admin.from("employees").update({ user_id: targetUserId }).eq("id", emp.id);
      await admin.from("shop_members").upsert(
        { shop_id: emp.shop_id, user_id: targetUserId, role: "employee" },
        { onConflict: "shop_id,user_id" },
      );
    } else {
      // Update password for existing user
      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      });
      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, user_id: targetUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});