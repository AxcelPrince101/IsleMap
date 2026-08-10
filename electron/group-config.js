/**
 * Realtime sync app config — one Balake/app setup, not per-player accounts.
 * Players only need a username; PC ID is generated locally.
 *
 * Resolution order: env / .env → packaged defaults.
 * (Dashboard no longer exposes maintainer overrides.)
 */
const defaults = require("./pusher-defaults");

function readEnv(name, fallback = "") {
  const v = process.env[name];
  return v == null || v === "" ? fallback : String(v).trim();
}

function getGroupConfig(settings = {}) {
  const key =
    String(settings.groupPusherKey || "").trim() ||
    readEnv("ISLEMAP_PUSHER_KEY", defaults.key);
  const cluster =
    String(settings.groupPusherCluster || "").trim() ||
    readEnv("ISLEMAP_PUSHER_CLUSTER", defaults.cluster);
  const appId = readEnv("ISLEMAP_PUSHER_APP_ID", defaults.appId);
  const secret = readEnv("ISLEMAP_PUSHER_SECRET", defaults.secret);

  // Prefer explicit Advanced / env auth URL. Ignore localhost when we can
  // sign in-process (packaged installs don't run npm run group:auth).
  let authEndpoint =
    String(settings.groupAuthUrl || "").trim() ||
    readEnv("ISLEMAP_PUSHER_AUTH", "");
  const localAuth =
    /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:|\/|$)/i.test(authEndpoint);
  if (localAuth && secret && appId) {
    authEndpoint = "";
  }
  if (!authEndpoint && !secret) {
    authEndpoint = defaults.authEndpoint || "";
  }

  return {
    key,
    cluster,
    authEndpoint,
    appId,
    secret,
  };
}

function isConfigured(cfg) {
  if (!cfg?.key || !cfg?.cluster) return false;
  if (cfg.secret && cfg.appId) return true;
  if (cfg.authEndpoint) return true;
  return false;
}

module.exports = {
  getGroupConfig,
  isConfigured,
};
