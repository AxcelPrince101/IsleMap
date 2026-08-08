const { app, BrowserWindow, shell } = require("electron");

/** @typedef {"idle"|"checking"|"current"|"available"|"downloading"|"ready"|"error"} UpdateState */

const GITHUB = Object.freeze({
  owner: "AxcelPrince101",
  repo: "IsleMap",
});

/** @type {{ state: UpdateState, version?: string, latestVersion?: string, message?: string, percent?: number, releaseUrl?: string, installerUrl?: string }} */
let lastStatus = { state: "idle", version: undefined };

function currentVersion() {
  return app.getVersion();
}

function releasePageUrl(tag) {
  const base = `https://github.com/${GITHUB.owner}/${GITHUB.repo}/releases`;
  return tag ? `${base}/tag/${encodeURIComponent(tag)}` : `${base}/latest`;
}

function installerUrlFor(version) {
  const v = String(version || "").replace(/^v/i, "");
  if (!v) return releasePageUrl();
  return `https://github.com/${GITHUB.owner}/${GITHUB.repo}/releases/download/v${v}/IsleMap-Setup-${v}.exe`;
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
  const asset = (data.assets || []).find((a) =>
    /\.exe$/i.test(a.name || "")
  );
  const installerUrl = asset?.browser_download_url || installerUrlFor(latestVersion);

  if (!latestVersion) {
    throw new Error("Latest release has no version tag");
  }

  if (compareSemver(latestVersion, currentVersion()) > 0) {
    return broadcastStatus({
      state: "available",
      latestVersion,
      releaseUrl,
      installerUrl,
      message: app.isPackaged
        ? `Version ${latestVersion} is available.`
        : `Version ${latestVersion} is available — download the installer from the release.`,
    });
  }

  return broadcastStatus({
    state: "current",
    latestVersion,
    releaseUrl,
    installerUrl,
    message: "You’re on the latest version.",
  });
}

function getAutoUpdater() {
  // eslint-disable-next-line global-require
  const mod = require("electron-updater");
  return mod.autoUpdater || mod.default?.autoUpdater || mod;
}

let wired = false;

function wireAutoUpdater() {
  if (!app.isPackaged) return null;
  const autoUpdater = getAutoUpdater();

  // Unsigned / self-signed NSIS builds fail Authenticode checks otherwise
  try {
    autoUpdater.verifyUpdateCodeSignature = false;
  } catch {
    /* older electron-updater */
  }
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.logger = console;

  if (!wired) {
    try {
      autoUpdater.setFeedURL({
        provider: "github",
        owner: GITHUB.owner,
        repo: GITHUB.repo,
        releaseType: "release",
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
        installerUrl: installerUrlFor(info.version),
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
        releaseUrl: lastStatus.releaseUrl,
        installerUrl: lastStatus.installerUrl,
        message: `Downloading… ${Math.floor(progress.percent || 0)}%`,
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      broadcastStatus({
        state: "ready",
        latestVersion: info.version,
        releaseUrl: releasePageUrl(`v${info.version}`),
        installerUrl: installerUrlFor(info.version),
        message: `Version ${info.version} downloaded. Restart to install.`,
      });
    });
    autoUpdater.on("error", (err) => {
      console.error("[updater]", err);
      const msg = String(err?.message || err || "Update failed");
      broadcastStatus({
        state: "error",
        message: msg.includes("not signed") || msg.includes("signature")
          ? "Update signature check failed — use Download installer instead."
          : msg,
        releaseUrl: lastStatus.releaseUrl || releasePageUrl(),
        installerUrl: lastStatus.installerUrl || installerUrlFor(lastStatus.latestVersion),
        latestVersion: lastStatus.latestVersion,
      });
    });

    wired = true;
  }

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
  // Always resolve against GitHub releases first (reliable version compare)
  let githubStatus;
  try {
    githubStatus = await checkGitHubLatest();
  } catch (err) {
    githubStatus = null;
    console.warn("[updater] GitHub API check failed", err);
  }

  if (!app.isPackaged) {
    if (githubStatus) return githubStatus;
    return broadcastStatus({
      state: "error",
      message: "Could not reach GitHub releases.",
      releaseUrl: releasePageUrl(),
    });
  }

  const autoUpdater = wireAutoUpdater();
  broadcastStatus({
    state: "checking",
    latestVersion: githubStatus?.latestVersion,
    releaseUrl: githubStatus?.releaseUrl,
    installerUrl: githubStatus?.installerUrl,
  });

  try {
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo;
    if (info?.version && compareSemver(info.version, currentVersion()) > 0) {
      return broadcastStatus({
        state: "available",
        latestVersion: info.version,
        releaseUrl: releasePageUrl(`v${info.version}`),
        installerUrl: installerUrlFor(info.version),
        message: `Version ${info.version} is available.`,
      });
    }
    if (githubStatus?.state === "available") return githubStatus;
    if (githubStatus?.state === "current") return githubStatus;
    return broadcastStatus({
      state: "current",
      latestVersion: info?.version || currentVersion(),
      releaseUrl: releasePageUrl(),
      message: "You’re on the latest version.",
    });
  } catch (err) {
    console.warn("[updater] electron-updater check failed", err);
    if (githubStatus) {
      return broadcastStatus({
        ...githubStatus,
        message:
          githubStatus.state === "available"
            ? `${githubStatus.message} (use Download installer if in-app download fails)`
            : githubStatus.message,
      });
    }
    return broadcastStatus({
      state: "error",
      message: String(err?.message || err),
      releaseUrl: releasePageUrl(),
    });
  }
}

async function openInstallerDownload() {
  const url =
    lastStatus.installerUrl ||
    installerUrlFor(lastStatus.latestVersion) ||
    lastStatus.releaseUrl ||
    releasePageUrl();
  await shell.openExternal(url);
  return broadcastStatus({
    ...lastStatus,
    message: "Opened installer download in your browser.",
  });
}

async function downloadUpdate() {
  if (!app.isPackaged) {
    return openInstallerDownload();
  }

  if (lastStatus.state !== "available" && lastStatus.state !== "error") {
    await checkForUpdates();
  }

  const autoUpdater = wireAutoUpdater();
  broadcastStatus({
    state: "downloading",
    percent: 0,
    latestVersion: lastStatus.latestVersion,
    releaseUrl: lastStatus.releaseUrl,
    installerUrl: lastStatus.installerUrl || installerUrlFor(lastStatus.latestVersion),
    message: "Starting download…",
  });

  try {
    await autoUpdater.downloadUpdate();
    return lastStatus;
  } catch (err) {
    console.error("[updater] download failed, opening installer URL", err);
    await openInstallerDownload();
    return broadcastStatus({
      state: "available",
      latestVersion: lastStatus.latestVersion,
      releaseUrl: lastStatus.releaseUrl,
      installerUrl: lastStatus.installerUrl || installerUrlFor(lastStatus.latestVersion),
      message:
        "In-app download failed — opened the installer in your browser. Run it to update.",
    });
  }
}

function installUpdate() {
  if (!app.isPackaged) {
    openInstallerDownload();
    return { ok: false, reason: "not-packaged" };
  }
  const autoUpdater = wireAutoUpdater();
  setImmediate(() => {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      console.error("[updater] quitAndInstall failed", err);
      openInstallerDownload();
    }
  });
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
  openInstallerDownload,
};
