const { BrowserWindow } = require("electron");
const PusherServer = require("pusher");
const PusherJS = require("pusher-js");
const {
  getPcId,
  getStoredUsername,
  setStoredUsername,
} = require("./identity");
const { getGroupConfig, isConfigured } = require("./group-config");

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOC_MIN_INTERVAL_MS = 800;
const STALE_PEER_MS = 45000;

/** @type {import('pusher-js').default | null} */
let pusher = null;
/** @type {any} */
let channel = null;
/** @type {ReturnType<typeof getGroupConfig>} */
let config = getGroupConfig();

let username = "Hunter";
/** @type {string | null} */
let roomCode = null;
/** @type {string | null} */
let hostPcId = null;
/** @type {'idle'|'connecting'|'joined'|'error'} */
let status = "idle";
let statusMessage = "";
/** @type {Map<string, any>} */
const members = new Map();
/** @type {Map<string, any>} */
const peerLocations = new Map();
let lastPublishTs = 0;
/** @type {((partial: object) => void) | null} */
let persistSettings = null;
/** @type {(() => {x:number,y:number,z:number}|null) | null} */
let getLastLocation = null;

function myPcId() {
  return getPcId();
}

function normalizeUsername(name) {
  const t = String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  return t || "Hunter";
}

function makeRoomCode() {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function channelNameFor(code) {
  return `presence-islemap-${String(code).toUpperCase()}`;
}

function colorForPcId(pcId) {
  let h = 0;
  const s = String(pcId || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 78% 62%)`;
}

function broadcast() {
  const snapshot = getSnapshot();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("group:status", snapshot);
    }
  }
}

function memberList() {
  const list = [];
  for (const [pcId, m] of members) {
    list.push({
      pcId,
      username: m.username || "Hunter",
      color: colorForPcId(pcId),
      isSelf: pcId === myPcId(),
      isHost: pcId === hostPcId,
      online: true,
      lastLoc: peerLocations.get(pcId) || null,
    });
  }
  list.sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
    return a.username.localeCompare(b.username);
  });
  return list;
}

function getSnapshot() {
  return {
    status,
    message: statusMessage,
    configured: isConfigured(config),
    username,
    pcId: myPcId(),
    roomCode,
    hostPcId,
    isHost: Boolean(roomCode && hostPcId === myPcId()),
    members: memberList(),
    peers: [...peerLocations.values()].filter((p) => p.pcId !== myPcId()),
    config: {
      key: config.key ? `${config.key.slice(0, 6)}…` : "",
      cluster: config.cluster,
      authEndpoint: config.authEndpoint,
      hasKey: Boolean(config.key),
      hasAuth: Boolean(config.authEndpoint || config.secret),
    },
  };
}

function setStatus(next, message = "") {
  status = next;
  statusMessage = message;
  broadcast();
}

function upsertMember(pcId, info = {}) {
  if (!pcId) return;
  const prev = members.get(pcId) || {};
  members.set(pcId, {
    username: normalizeUsername(info.username || prev.username || "Hunter"),
  });
}

function removeMember(pcId) {
  members.delete(pcId);
  peerLocations.delete(pcId);
}

async function authorizeChannel(socketId, channelName) {
  const presenceData = {
    user_id: myPcId(),
    user_info: {
      username,
      pcId: myPcId(),
    },
  };

  // Local/dev: sign with secret in main (never sent to renderer)
  if (config.secret && config.key && config.appId) {
    const server = new PusherServer({
      appId: config.appId,
      key: config.key,
      secret: config.secret,
      cluster: config.cluster,
      useTLS: true,
    });
    return server.authorizeChannel(socketId, channelName, presenceData);
  }

  if (!config.authEndpoint) {
    throw new Error("Missing Pusher auth endpoint (and no local secret)");
  }

  const res = await fetch(config.authEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      socket_id: socketId,
      channel_name: channelName,
      pcId: myPcId(),
      username,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Auth failed (${res.status}) ${text.slice(0, 120)}`);
  }
  return res.json();
}

function ensurePusher() {
  if (pusher) return pusher;
  if (!config.key) throw new Error("Pusher key not configured");

  pusher = new PusherJS(config.key, {
    cluster: config.cluster || "mt1",
    forceTLS: true,
    authorizer: (ch) => ({
      authorize: (socketId, callback) => {
        authorizeChannel(socketId, ch.name)
          .then((auth) => callback(null, auth))
          .catch((err) => callback(err, null));
      },
    }),
  });

  pusher.connection.bind("error", (err) => {
    console.warn("[group] pusher error", err);
    setStatus("error", err?.error?.data?.message || err?.message || "Pusher error");
  });

  return pusher;
}

function bindChannelHandlers(ch) {
  ch.bind("pusher:subscription_succeeded", (data) => {
    members.clear();
    const hash = data?.members || {};
    for (const [id, info] of Object.entries(hash)) {
      upsertMember(id, info);
    }
    upsertMember(myPcId(), { username });
    if (!hostPcId) hostPcId = myPcId();
    setStatus("joined", `In group ${roomCode}`);
    // Announce host + username; publish last known loc
    try {
      ch.trigger("client-host", { hostPcId, roomCode });
      ch.trigger("client-username", { pcId: myPcId(), username });
    } catch (err) {
      console.warn("[group] trigger on join", err);
    }
    const loc = getLastLocation?.();
    if (loc) publishLocation(loc, true);
  });

  ch.bind("pusher:subscription_error", (err) => {
    console.warn("[group] subscribe error", err);
    setStatus("error", "Could not join group (auth/config)");
    cleanupChannel(false);
  });

  ch.bind("pusher:member_added", (member) => {
    upsertMember(member.id, member.info || {});
    broadcast();
  });

  ch.bind("pusher:member_removed", (member) => {
    removeMember(member.id);
    if (member.id === hostPcId) {
      // Elect lowest pcId still present as host
      const ids = [...members.keys()].sort();
      hostPcId = ids[0] || myPcId();
      try {
        ch.trigger("client-host", { hostPcId, roomCode });
      } catch {
        /* ignore */
      }
    }
    broadcast();
  });

  ch.bind("client-host", (payload) => {
    if (payload?.hostPcId) {
      hostPcId = String(payload.hostPcId);
      broadcast();
    }
  });

  ch.bind("client-username", (payload) => {
    if (payload?.pcId) {
      upsertMember(payload.pcId, { username: payload.username });
      const loc = peerLocations.get(payload.pcId);
      if (loc) {
        loc.username = normalizeUsername(payload.username);
        peerLocations.set(payload.pcId, loc);
      }
      broadcast();
    }
  });

  ch.bind("client-loc", (payload) => {
    if (!payload?.pcId || payload.pcId === myPcId()) return;
    if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y)) return;
    upsertMember(payload.pcId, { username: payload.username });
    peerLocations.set(payload.pcId, {
      pcId: payload.pcId,
      username: normalizeUsername(payload.username),
      x: payload.x,
      y: payload.y,
      z: Number.isFinite(payload.z) ? payload.z : 0,
      ts: payload.ts || Date.now(),
      color: colorForPcId(payload.pcId),
    });
    broadcast();
  });

  ch.bind("client-kick", (payload) => {
    if (payload?.targetPcId === myPcId()) {
      setStatus("idle", "Removed from group");
      leaveGroup(false);
    }
  });
}

function cleanupChannel(resetStatus = true) {
  if (channel && pusher) {
    try {
      pusher.unsubscribe(channel.name);
    } catch {
      /* ignore */
    }
  }
  channel = null;
  roomCode = null;
  hostPcId = null;
  members.clear();
  peerLocations.clear();
  if (resetStatus) setStatus("idle", "");
  else broadcast();
}

function disconnectPusher() {
  cleanupChannel(true);
  if (pusher) {
    try {
      pusher.disconnect();
    } catch {
      /* ignore */
    }
    pusher = null;
  }
}

function configure({ settings, saveSettings, lastLocation } = {}) {
  persistSettings = typeof saveSettings === "function" ? saveSettings : null;
  getLastLocation = typeof lastLocation === "function" ? lastLocation : null;
  if (settings) {
    const fromSettings = String(settings.groupUsername || "").trim();
    const fromIdentity = getStoredUsername();
    username = normalizeUsername(fromSettings || fromIdentity || username);
    config = getGroupConfig(settings);
    // Keep identity + settings aligned so updates never drop the name
    if (username && username !== "Hunter") {
      setStoredUsername(username);
      if (!fromSettings) persistSettings?.({ groupUsername: username });
    }
  }
  broadcast();
}

function setUsername(next) {
  username = normalizeUsername(next);
  setStoredUsername(username);
  persistSettings?.({ groupUsername: username });
  if (channel) {
    upsertMember(myPcId(), { username });
    try {
      channel.trigger("client-username", { pcId: myPcId(), username });
    } catch {
      /* ignore */
    }
  }
  broadcast();
  return username;
}

async function createGroup() {
  if (!isConfigured(config)) {
    setStatus("error", "Group sync needs Pusher config (one-time app setup)");
    return getSnapshot();
  }
  const code = makeRoomCode();
  return joinGroup(code, { asHost: true });
}

async function joinGroup(code, { asHost = false } = {}) {
  const cleaned = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  if (cleaned.length < 4) {
    setStatus("error", "Enter a valid group code");
    return getSnapshot();
  }
  if (!isConfigured(config)) {
    setStatus("error", "Group sync needs Pusher config (one-time app setup)");
    return getSnapshot();
  }

  leaveGroup(false);
  setStatus("connecting", asHost ? "Creating group…" : "Joining…");
  roomCode = cleaned;
  hostPcId = asHost ? myPcId() : null;

  try {
    ensurePusher();
    const name = channelNameFor(cleaned);
    channel = pusher.subscribe(name);
    bindChannelHandlers(channel);
    persistSettings?.({ groupLastCode: cleaned });
  } catch (err) {
    console.warn("[group] join failed", err);
    cleanupChannel(false);
    setStatus("error", err?.message || "Join failed");
  }
  return getSnapshot();
}

function leaveGroup(updateStatus = true) {
  if (channel && pusher) {
    try {
      pusher.unsubscribe(channel.name);
    } catch {
      /* ignore */
    }
  }
  channel = null;
  roomCode = null;
  hostPcId = null;
  members.clear();
  peerLocations.clear();
  if (updateStatus) setStatus("idle", "Left group");
  else broadcast();
  return getSnapshot();
}

function kickMember(targetPcId) {
  if (!channel || hostPcId !== myPcId()) {
    return { ok: false, reason: "not-host" };
  }
  if (!targetPcId || targetPcId === myPcId()) {
    return { ok: false, reason: "invalid-target" };
  }
  try {
    channel.trigger("client-kick", {
      targetPcId,
      byPcId: myPcId(),
    });
    removeMember(targetPcId);
    broadcast();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err?.message || "kick-failed" };
  }
}

function publishLocation(coords, force = false) {
  if (!channel || !coords) return;
  if (!Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return;
  const now = Date.now();
  if (!force && now - lastPublishTs < LOC_MIN_INTERVAL_MS) return;
  lastPublishTs = now;
  try {
    channel.trigger("client-loc", {
      pcId: myPcId(),
      username,
      x: coords.x,
      y: coords.y,
      z: Number.isFinite(coords.z) ? coords.z : 0,
      ts: now,
    });
  } catch (err) {
    console.warn("[group] publish loc", err);
  }
}

function updateConfigFromSettings(settings) {
  const next = getGroupConfig(settings || {});
  const changed =
    next.key !== config.key ||
    next.cluster !== config.cluster ||
    next.authEndpoint !== config.authEndpoint ||
    next.secret !== config.secret ||
    next.appId !== config.appId;
  config = next;
  if (settings?.groupUsername) {
    username = normalizeUsername(settings.groupUsername);
  }
  if (changed) {
    const code = roomCode;
    const wasHost = hostPcId === myPcId();
    disconnectPusher();
    if (code) joinGroup(code, { asHost: wasHost });
  }
  broadcast();
}

// Drop stale peer pins periodically
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, loc] of peerLocations) {
    if (now - (loc.ts || 0) > STALE_PEER_MS) {
      peerLocations.delete(id);
      changed = true;
    }
  }
  if (changed) broadcast();
}, 10000);

module.exports = {
  configure,
  getSnapshot,
  setUsername,
  createGroup,
  joinGroup,
  leaveGroup,
  kickMember,
  publishLocation,
  updateConfigFromSettings,
  disconnectPusher,
  myPcId,
};
