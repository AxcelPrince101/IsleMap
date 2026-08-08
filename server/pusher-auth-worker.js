/**
 * Cloudflare Worker — Pusher presence auth for IsleMap groups.
 *
 * Bind secrets: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
 * Players send { socket_id, channel_name, pcId, username } — no accounts.
 */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function hmacSha256Hex(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: corsHeaders() });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "invalid json" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const socketId = body.socket_id;
    const channelName = body.channel_name;
    const pcId = String(body.pcId || "").trim();
    const username = String(body.username || "Hunter").trim().slice(0, 24) || "Hunter";

    if (!socketId || !channelName || !pcId) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }
    if (!String(channelName).startsWith("presence-islemap-")) {
      return new Response(JSON.stringify({ error: "channel not allowed" }), {
        status: 403,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const channelData = JSON.stringify({
      user_id: pcId,
      user_info: { username, pcId },
    });
    const stringToSign = `${socketId}:${channelName}:${channelData}`;
    const signature = await hmacSha256Hex(env.PUSHER_SECRET, stringToSign);

    return new Response(
      JSON.stringify({
        auth: `${env.PUSHER_KEY}:${signature}`,
        channel_data: channelData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  },
};
