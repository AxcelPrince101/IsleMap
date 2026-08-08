/**
 * Pusher app config — one Balake/app setup, not per-player accounts.
 *
 * Players only need a username; PC ID is generated locally.
 * Set env vars (or Advanced fields in Group) before shipping.
 */
function readEnv(name, fallback = "") {
  const v = process.env[name];
  return v == null || v === "" ? fallback : String(v).trim();
}

function getGroupConfig(settings = {}) {
  return {
    key:
      String(settings.groupPusherKey || "").trim() ||
      readEnv("ISLEMAP_PUSHER_KEY"),
    cluster:
      String(settings.groupPusherCluster || "").trim() ||
      readEnv("ISLEMAP_PUSHER_CLUSTER", "ap1"),
    authEndpoint:
      String(settings.groupAuthUrl || "").trim() ||
      readEnv("ISLEMAP_PUSHER_AUTH", "http://127.0.0.1:8787/pusher/auth"),
    // Server-side only — never expose to renderer. Used by local auth fallback.
    appId: readEnv("ISLEMAP_PUSHER_APP_ID"),
    secret: readEnv("ISLEMAP_PUSHER_SECRET"),
  };
}

function isConfigured(cfg) {
  return Boolean(cfg?.key && cfg?.cluster && (cfg?.authEndpoint || cfg?.secret));
}

module.exports = {
  getGroupConfig,
  isConfigured,
};
