const { app, BrowserWindow } = require("electron");
const PusherServer = require("pusher");
const PusherJS = require("pusher-js");
const {
  getPcId,
  getStoredUsername,
  setStoredUsername,
} = require("./identity");
const { getGroupConfig, isConfigured } = require("./group-config");

/** All-players map tooling — unpackaged builds only (same gate as Map editor) */
function isDevBuild() {
  try {
    return !app.isPackaged;
  } catch {
    return false;
  }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOC_MIN_INTERVAL_MS = 800;
const STALE_PEER_MS = 45000;
/** App-wide presence — every running client joins for active-user count */
const ONLINE_CHANNEL = "presence-islemap-online";

/** @type {import('pusher-js').default | null} */
let pusher = null;
/** @type {any} */
let channel = null;
/** @type {any} */
let onlineChannel = null;
/** @type {ReturnType<typeof getGroupConfig>} */
let config = getGroupConfig();

let username = "Hunter";
/** @type {string | null} */
let roomCode = null;
/** @type {string | null} */
let hostPcId = null;
/** True when this client created the lobby (or reconnected as host). */
let intendHost = false;
/** @type {ReturnType<typeof setTimeout> | null} */
let hostResolveTimer = null;
/** @type {'idle'|'connecting'|'joined'|'error'} */
let status = "idle";
let statusMessage = "";
/** Live count of IsleMap clients on the global presence channel */
let onlineCount = 0;
/** @type {'idle'|'connecting'|'online'|'error'} */
let onlineStatus = "idle";
let onlineMessage = "";
/** @type {Map<string, any>} */
const members = new Map();
/** @type {Map<string, any>} */
const peerLocations = new Map();
/** Last known locations on the app-wide presence channel */
/** @type {Map<string, any>} */
const globalLocations = new Map();
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

function getOnlineSnapshot() {
  return {
    status: onlineStatus,
    message: onlineMessage,
    count: onlineCount,
    configured: isConfigured(config),
    channel: ONLINE_CHANNEL,
  };
}

function broadcastOnline() {
  const snapshot = getOnlineSnapshot();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("online:status", snapshot);
    }
  }
}

function getGlobalPlayersSnapshot() {
  if (!isDevBuild()) {
    return { ok: false, status: onlineStatus, message: "dev-only", count: 0, players: [] };
  }
  return {
    ok: true,
    status: onlineStatus,
    message: onlineMessage,
    count: onlineCount,
    players: [...globalLocations.values()].sort((a, b) => {
      if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
      return String(a.username || "").localeCompare(String(b.username || ""));
    }),
  };
}

function broadcastGlobalPlayers() {
  if (!isDevBuild()) return;
  const snapshot = getGlobalPlayersSnapshot();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("global:players", snapshot);
    }
  }
}

function upsertGlobalLocation(payload) {
  if (!isDevBuild()) return;
  if (!payload?.pcId) return;
  if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y)) return;
  const pcId = String(payload.pcId);
  globalLocations.set(pcId, {
    pcId,
    username: normalizeUsername(payload.username),
    x: payload.x,
    y: payload.y,
    z: Number.isFinite(payload.z) ? payload.z : 0,
    ts: payload.ts || Date.now(),
    color: colorForPcId(pcId),
    isSelf: pcId === myPcId(),
  });
  broadcastGlobalPlayers();
}

function setOnlineStatus(next, message = "", count = onlineCount) {
  onlineStatus = next;
  onlineMessage = message;
  if (Number.isFinite(count)) onlineCount = Math.max(0, Math.floor(count));
  broadcastOnline();
}

function readPresenceCount(ch) {
  const n = ch?.members?.count;
  if (Number.isFinite(n)) return n;
  const hash = ch?.members?.members;
  if (hash && typeof hash === "object") return Object.keys(hash).length;
  return onlineCount;
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
  const userInfo = {
    username,
    pcId: myPcId(),
  };
  // Dev-only: seed last pin into presence info for All players
  if (isDevBuild()) {
    const loc = getLastLocation?.();
    if (loc && Number.isFinite(loc.x) && Number.isFinite(loc.y)) {
      userInfo.x = loc.x;
      userInfo.y = loc.y;
      userInfo.z = Number.isFinite(loc.z) ? loc.z : 0;
      userInfo.ts = Date.now();
    }
  }
  const presenceData = {
    user_id: myPcId(),
    user_info: userInfo,
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
    const msg = err?.error?.data?.message || err?.message || "Pusher error";
    if (roomCode) setStatus("error", msg);
    if (onlineChannel) setOnlineStatus("error", msg, onlineCount);
  });

  return pusher;
}

function seedPresenceMemberInfo(ch) {
  const membersObj = ch?.members;
  if (!membersObj || typeof membersObj.each !== "function") return;
  membersObj.each((member) => {
    const id = member?.id;
    const info = member?.info || {};
    if (!id) return;
    if (Number.isFinite(info.x) && Number.isFinite(info.y)) {
      upsertGlobalLocation({
        pcId: id,
        username: info.username,
        x: info.x,
        y: info.y,
        z: info.z,
        ts: info.ts || Date.now(),
      });
    }
  });
}

function requestOnlineLocations() {
  if (!isDevBuild() || !onlineChannel) return;
  try {
    onlineChannel.trigger("client-loc-req", {
      pcId: myPcId(),
      ts: Date.now(),
    });
  } catch (err) {
    console.warn("[online] loc-req", err);
  }
}

function bindOnlineChannelHandlers(ch) {
  ch.bind("pusher:subscription_succeeded", () => {
    setOnlineStatus("online", "Connected", readPresenceCount(ch));
    if (isDevBuild()) {
      seedPresenceMemberInfo(ch);
      const loc = getLastLocation?.();
      if (loc) publishLocation(loc, true);
      setTimeout(() => requestOnlineLocations(), 400);
    }
  });
  ch.bind("pusher:subscription_error", (err) => {
    console.warn("[online] subscribe error", err);
    setOnlineStatus(
      "error",
      "Could not read active users",
      onlineCount
    );
  });
  ch.bind("pusher:member_added", () => {
    setOnlineStatus("online", "Connected", readPresenceCount(ch));
    if (isDevBuild()) {
      const loc = getLastLocation?.();
      if (loc) publishLocation(loc, true);
    }
  });
  ch.bind("pusher:member_removed", (member) => {
    if (isDevBuild()) {
      const id = member?.id;
      if (id && globalLocations.has(id)) {
        globalLocations.delete(id);
        broadcastGlobalPlayers();
      }
    }
    setOnlineStatus("online", "Connected", readPresenceCount(ch));
  });
  // All-players location sharing — unpackaged only
  if (isDevBuild()) {
    ch.bind("client-loc", (payload) => {
      if (!payload?.pcId || payload.pcId === myPcId()) return;
      upsertGlobalLocation(payload);
    });
    ch.bind("client-loc-req", (payload) => {
      if (!payload?.pcId || payload.pcId === myPcId()) return;
      const loc = getLastLocation?.();
      if (loc) publishLocation(loc, true);
    });
  }
}

/**
 * Keep a global presence subscription so Updates can show how many
 * IsleMap clients are running right now.
 */
function ensureOnlinePresence() {
  if (!isConfigured(config)) {
    setOnlineStatus("idle", "Pusher not configured", 0);
    return getOnlineSnapshot();
  }
  if (onlineChannel) {
    broadcastOnline();
    return getOnlineSnapshot();
  }

  try {
    setOnlineStatus("connecting", "Connecting…", onlineCount);
    ensurePusher();
    onlineChannel = pusher.subscribe(ONLINE_CHANNEL);
    bindOnlineChannelHandlers(onlineChannel);
  } catch (err) {
    console.warn("[online] ensure failed", err);
    onlineChannel = null;
    setOnlineStatus("error", err?.message || "Online presence failed", 0);
  }
  return getOnlineSnapshot();
}

function teardownOnlinePresence() {
  if (onlineChannel && pusher) {
    try {
      pusher.unsubscribe(ONLINE_CHANNEL);
    } catch {
      /* ignore */
    }
  }
  onlineChannel = null;
  globalLocations.clear();
  broadcastGlobalPlayers();
}

function clearHostResolveTimer() {
  if (hostResolveTimer) {
    clearTimeout(hostResolveTimer);
    hostResolveTimer = null;
  }
}

function announceHost() {
  if (!channel || !hostPcId) return;
  try {
    channel.trigger("client-host", { hostPcId, roomCode });
  } catch (err) {
    console.warn("[group] announce host", err);
  }
}

function bindChannelHandlers(ch) {
  ch.bind("pusher:subscription_succeeded", (data) => {
    members.clear();
    const hash = data?.members || {};
    for (const [id, info] of Object.entries(hash)) {
      upsertMember(id, info);
    }
    upsertMember(myPcId(), { username });

    const others = [...members.keys()].filter((id) => id !== myPcId());
    clearHostResolveTimer();

    if (intendHost) {
      // Creator (or reconnecting host) keeps host and announces
      hostPcId = myPcId();
      announceHost();
    } else if (others.length === 0) {
      // Joined an empty room (stale code) — become host
      hostPcId = myPcId();
      intendHost = true;
      announceHost();
    } else {
      // Wait for the real host to announce — never self-promote immediately
      hostPcId = null;
      hostResolveTimer = setTimeout(() => {
        hostResolveTimer = null;
        if (!channel || hostPcId) return;
        // Fallback if host never announced (e.g. old client bug)
        const ids = [...members.keys()].sort();
        hostPcId = ids[0] || myPcId();
        if (hostPcId === myPcId()) {
          intendHost = true;
          announceHost();
        }
        broadcast();
      }, 1500);
    }

    setStatus("joined", `In group ${roomCode}`);
    try {
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
    // Host re-announces so joiners learn who owns the lobby
    if (hostPcId === myPcId()) {
      announceHost();
    }
    broadcast();
  });

  ch.bind("pusher:member_removed", (member) => {
    removeMember(member.id);
    if (member.id === hostPcId) {
      // Elect lowest pcId still present as host
      const ids = [...members.keys()].sort();
      hostPcId = ids[0] || myPcId();
      intendHost = hostPcId === myPcId();
      if (intendHost) announceHost();
    }
    broadcast();
  });

  ch.bind("client-host", (payload) => {
    if (!payload?.hostPcId) return;
    const next = String(payload.hostPcId);
    // Creator rejects foreign takeover attempts while still in the room
    if (
      intendHost &&
      hostPcId === myPcId() &&
      next !== myPcId() &&
      members.has(myPcId())
    ) {
      announceHost();
      return;
    }
    if (hostPcId !== next) {
      hostPcId = next;
      intendHost = hostPcId === myPcId();
      clearHostResolveTimer();
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
  clearHostResolveTimer();
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
  intendHost = false;
  members.clear();
  peerLocations.clear();
  if (resetStatus) setStatus("idle", "");
  else broadcast();
}

function disconnectPusher() {
  cleanupChannel(true);
  teardownOnlinePresence();
  if (pusher) {
    try {
      pusher.disconnect();
    } catch {
      /* ignore */
    }
    pusher = null;
  }
  setOnlineStatus("idle", "", 0);
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
  const raw = String(next || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  if (!raw) {
    return { ok: false, reason: "empty", username };
  }
  username = raw;
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
  return { ok: true, username };
}

function hasConfiguredUsername() {
  return Boolean(String(getStoredUsername() || "").trim());
}

async function createGroup() {
  if (!isConfigured(config)) {
    setStatus("error", "Group sync needs Pusher config (one-time app setup)");
    return getSnapshot();
  }
  if (!hasConfiguredUsername()) {
    setStatus("error", "Set your game username before creating a group");
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
  if (!hasConfiguredUsername()) {
    setStatus("error", "Set your game username before joining a group");
    return getSnapshot();
  }

  leaveGroup(false);
  setStatus("connecting", asHost ? "Creating group…" : "Joining…");
  roomCode = cleaned;
  intendHost = Boolean(asHost);
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
  clearHostResolveTimer();
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
  intendHost = false;
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
  if (!coords) return;
  if (!Number.isFinite(coords.x) || !Number.isFinite(coords.y)) return;
  const now = Date.now();
  if (!force && now - lastPublishTs < LOC_MIN_INTERVAL_MS) return;
  const payload = {
    pcId: myPcId(),
    username,
    x: coords.x,
    y: coords.y,
    z: Number.isFinite(coords.z) ? coords.z : 0,
    ts: now,
  };
  // All-players tracking is unpackaged-only (Map editor style)
  if (isDevBuild()) upsertGlobalLocation(payload);
  if (!channel && !(isDevBuild() && onlineChannel)) {
    lastPublishTs = now;
    return;
  }
  if (channel) {
    try {
      channel.trigger("client-loc", payload);
    } catch (err) {
      console.warn("[group] publish loc", err);
    }
  }
  // Global presence loc — only from unpackaged builds
  if (isDevBuild() && onlineChannel) {
    try {
      onlineChannel.trigger("client-loc", payload);
    } catch (err) {
      console.warn("[online] publish loc", err);
    }
  }
  lastPublishTs = now;
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
    ensureOnlinePresence();
    if (code) joinGroup(code, { asHost: wasHost });
  }
  broadcast();
  broadcastOnline();
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

  let globalChanged = false;
  for (const [id, loc] of globalLocations) {
    if (now - (loc.ts || 0) > STALE_PEER_MS) {
      globalLocations.delete(id);
      globalChanged = true;
    }
  }
  if (globalChanged) broadcastGlobalPlayers();
}, 10000);

module.exports = {
  configure,
  getSnapshot,
  getOnlineSnapshot,
  getGlobalPlayersSnapshot,
  requestOnlineLocations,
  ensureOnlinePresence,
  setUsername,
  hasConfiguredUsername,
  createGroup,
  joinGroup,
  leaveGroup,
  kickMember,
  publishLocation,
  updateConfigFromSettings,
  disconnectPusher,
  myPcId,
};
