const { app, BrowserWindow, shell } = require("electron");

/** @typedef {"idle"|"checking"|"current"|"available"|"downloading"|"ready"|"error"} UpdateState */

const GITHUB = Object.freeze({
  owner: "AxcelPrince101",
  repo: "IsleMap",
});

/** @type {{ state: UpdateState, version?: string, latestVersion?: string, message?: string, percent?: number, releaseUrl?: string }} */
let lastStatus = { state: "idle", version: undefined };

function currentVersion() {
  return app.getVersion();
}

function releasePageUrl(tag) {
  const base = `https://github.com/${GITHUB.owner}/${GITHUB.repo}/releases`;
  return tag ? `${base}/tag/${encodeURIComponent(tag)}` : `${base}/latest`;
}

function broadcastStatus(status) {
  lastStatus = {
    version: currentVersion(),
    packaged: app.isPackaged,
    github: { ...GITHUB },
    ...status,
  };
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("updater:status", lastStatus);
    }
  }
  return lastStatus;
}

function compareSemver(a, b) {
  const pa = String(a || "0")
    .replace(/^v/i, "")
    .split(/[.+-]/)
    .map((n) => parseInt(n, 10) || 0);
  const pb = String(b || "0")
    .replace(/^v/i, "")
    .split(/[.+-]/)
    .map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function checkGitHubLatest() {
  broadcastStatus({ state: "checking" });
  const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/releases/latest`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `IsleMap/${currentVersion()}`,
    },
  });

  if (res.status === 404) {
    return broadcastStatus({
      state: "current",
      latestVersion: currentVersion(),
      message: "No GitHub releases published yet.",
      releaseUrl: releasePageUrl(),
    });
  }

  if (!res.ok) {
    throw new Error(`GitHub releases error (${res.status})`);
  }

  const data = await res.json();
  const latestVersion = String(data.tag_name || data.name || "").replace(/^v/i, "");
  const releaseUrl = data.html_url || releasePageUrl(data.tag_name);
  if (!latestVersion) {
    throw new Error("Latest release has no version tag");
  }

  if (compareSemver(latestVersion, currentVersion()) > 0) {
    return broadcastStatus({
      state: "available",
      latestVersion,
      releaseUrl,
      message: app.isPackaged
        ? `Version ${latestVersion} is available.`
        : `Version ${latestVersion} is available — open the release to download (dev builds don’t auto-install).`,
    });
  }

  return broadcastStatus({
    state: "current",
    latestVersion,
    releaseUrl,
    message: "You’re on the latest version.",
  });
}

function getAutoUpdater() {
  // CommonJS interop (electron-updater default export)
  // eslint-disable-next-line global-require
  const mod = require("electron-updater");
  return mod.autoUpdater || mod.default?.autoUpdater || mod;
}

let wired = false;

function wireAutoUpdater() {
  if (wired || !app.isPackaged) return null;
  const autoUpdater = getAutoUpdater();
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  try {
    autoUpdater.setFeedURL({
      provider: "github",
      owner: GITHUB.owner,
      repo: GITHUB.repo,
    });
  } catch (err) {
    console.warn("[updater] setFeedURL failed", err);
  }

  autoUpdater.on("checking-for-update", () => {
    broadcastStatus({ state: "checking" });
  });
  autoUpdater.on("update-available", (info) => {
    broadcastStatus({
      state: "available",
      latestVersion: info.version,
      releaseUrl: releasePageUrl(`v${info.version}`),
      message: `Version ${info.version} is available.`,
    });
  });
  autoUpdater.on("update-not-available", (info) => {
    broadcastStatus({
      state: "current",
      latestVersion: info?.version || currentVersion(),
      releaseUrl: releasePageUrl(),
      message: "You’re on the latest version.",
    });
  });
  autoUpdater.on("download-progress", (progress) => {
    broadcastStatus({
      state: "downloading",
      percent: Number(progress.percent) || 0,
      latestVersion: lastStatus.latestVersion,
      message: `Downloading… ${Math.floor(progress.percent || 0)}%`,
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    broadcastStatus({
      state: "ready",
      latestVersion: info.version,
      message: `Version ${info.version} downloaded. Restart to install.`,
    });
  });
  autoUpdater.on("error", (err) => {
    console.error("[updater]", err);
    broadcastStatus({
      state: "error",
      message: String(err?.message || err || "Update failed"),
      releaseUrl: releasePageUrl(),
    });
  });

  wired = true;
  return autoUpdater;
}

function initUpdater() {
  if (!app.isPackaged) {
    broadcastStatus({
      state: "idle",
      message: "Dev build — update checks use GitHub releases (no auto-install).",
      releaseUrl: releasePageUrl(),
    });
    return;
  }

  wireAutoUpdater();
  setTimeout(() => {
    checkForUpdates().catch((err) => {
      broadcastStatus({
        state: "error",
        message: String(err?.message || err),
        releaseUrl: releasePageUrl(),
      });
    });
  }, 4000);
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    try {
      return await checkGitHubLatest();
    } catch (err) {
      return broadcastStatus({
        state: "error",
        message: String(err?.message || err),
        releaseUrl: releasePageUrl(),
      });
    }
  }

  const autoUpdater = wireAutoUpdater();
  broadcastStatus({ state: "checking" });
  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result) {
      // Fall back to GitHub API when updater inactive
      return checkGitHubLatest();
    }
    return lastStatus;
  } catch (err) {
    // Network / missing release metadata — still try public API
    try {
      return await checkGitHubLatest();
    } catch {
      return broadcastStatus({
        state: "error",
        message: String(err?.message || err),
        releaseUrl: releasePageUrl(),
      });
    }
  }
}

async function downloadUpdate() {
  if (!app.isPackaged) {
    if (lastStatus.releaseUrl) await shell.openExternal(lastStatus.releaseUrl);
    return lastStatus;
  }
  const autoUpdater = wireAutoUpdater();
  broadcastStatus({
    state: "downloading",
    percent: 0,
    latestVersion: lastStatus.latestVersion,
    message: "Starting download…",
  });
  await autoUpdater.downloadUpdate();
  return lastStatus;
}

function installUpdate() {
  if (!app.isPackaged) {
    return { ok: false, reason: "not-packaged" };
  }
  const autoUpdater = wireAutoUpdater();
  // isSilent, isForceRunAfter
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return { ok: true };
}

function getUpdateStatus() {
  return {
    ...lastStatus,
    version: currentVersion(),
    packaged: app.isPackaged,
    github: { ...GITHUB },
  };
}

module.exports = {
  GITHUB,
  initUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateStatus,
  releasePageUrl,
};
