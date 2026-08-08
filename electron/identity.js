const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app } = require("electron");

/**
 * Stable per-PC identity — no accounts.
 * Survives app updates (userData). Username is a display name; pcId is unique.
 */

function identityPath() {
  return path.join(app.getPath("userData"), "islemap-identity.json");
}

function makePcId() {
  return `PC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function normalizeIdentity(raw) {
  let pcId = String(raw?.pcId || "").trim().toUpperCase();
  if (!/^PC-[A-F0-9]{8}$/i.test(pcId)) pcId = makePcId();
  const username = String(raw?.username || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  return { pcId, username };
}

function loadIdentity() {
  try {
    const file = identityPath();
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      const identity = normalizeIdentity(raw);
      // Rewrite if we had to repair pcId
      if (!raw?.pcId || raw.pcId !== identity.pcId) saveIdentity(identity);
      return identity;
    }
  } catch (err) {
    console.warn("[identity] load failed", err);
  }
  const fresh = normalizeIdentity({});
  saveIdentity(fresh);
  return fresh;
}

function saveIdentity(identity) {
  const next = normalizeIdentity(identity);
  try {
    fs.mkdirSync(path.dirname(identityPath()), { recursive: true });
    fs.writeFileSync(identityPath(), JSON.stringify(next, null, 2), "utf8");
  } catch (err) {
    console.warn("[identity] save failed", err);
  }
  cached = next;
  return next;
}

let cached = null;

function getIdentity() {
  if (!cached) cached = loadIdentity();
  return cached;
}

function getPcId() {
  return getIdentity().pcId;
}

function getStoredUsername() {
  return getIdentity().username || "";
}

function setStoredUsername(name) {
  const cur = getIdentity();
  return saveIdentity({
    ...cur,
    username: String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 24),
  });
}

module.exports = {
  getPcId,
  getIdentity,
  loadIdentity,
  saveIdentity,
  getStoredUsername,
  setStoredUsername,
  identityPath,
};
