import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IMOU_BASE = "https://openapi.easy4ip.com/openapi";

// MD5 helper
function md5(str: string): string {
  const hash = createHash("md5");
  hash.update(str);
  return hash.toString();
}

// Build IMOU sign — algorithm per their docs:
// sign = MD5("time:" + time + ",nonce:" + nonce + ",appSecret:" + appSecret)
function buildSign(time: number, nonce: string, appSecret: string): string {
  return md5(`time:${time},nonce:${nonce},appSecret:${appSecret}`);
}

function buildSystem(appId: string, appSecret: string) {
  const time = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).slice(2, 12);
  return {
    ver: "1.0",
    sign: buildSign(time, nonce, appSecret),
    appId,
    time,
    nonce,
  };
}

async function imouCall(path: string, params: Record<string, unknown>, appId: string, appSecret: string) {
  const body = {
    system: buildSystem(appId, appSecret),
    params,
    id: String(Math.floor(Math.random() * 1e9)),
  };
  const res = await fetch(`${IMOU_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const APP_ID = Deno.env.get("IMOU_APP_ID");
    const APP_SECRET = Deno.env.get("IMOU_APP_SECRET");
    if (!APP_ID || !APP_SECRET) {
      return new Response(JSON.stringify({ error: "IMOU credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, deviceId, channelId } = await req.json();

    // List devices bound to the IMOU app account
    if (action === "listDevices") {
      const result = await imouCall("/deviceBaseList", { bindId: -1, limit: 50, type: "bindAndShare", needApInfo: false }, APP_ID, APP_SECRET);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get a snapshot URL/data for a specific device
    if (action === "snapshot") {
      if (!deviceId) {
        return new Response(JSON.stringify({ error: "deviceId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // setDeviceSnapEnhanced creates a snapshot, returns URL
      const result = await imouCall(
        "/setDeviceSnapEnhanced",
        { deviceId, channelId: channelId || "0" },
        APP_ID,
        APP_SECRET
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get live stream URL (HLS / FLV / RTMP)
    if (action === "liveStream") {
      if (!deviceId) {
        return new Response(JSON.stringify({ error: "deviceId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await imouCall(
        "/bindDeviceLive",
        { deviceId, channelId: channelId || "0", streamId: 1 },
        APP_ID,
        APP_SECRET
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test credentials
    if (action === "ping") {
      const result = await imouCall("/accessToken", {}, APP_ID, APP_SECRET);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
