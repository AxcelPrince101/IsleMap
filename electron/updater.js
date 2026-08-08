const { app, BrowserWindow, net, shell } = require("electron");
const fs = require("fs");
const path = require("path");

/** @typedef {"idle"|"checking"|"current"|"available"|"downloading"|"ready"|"error"} UpdateState */

const GITHUB = Object.freeze({
  owner: "AxcelPrince101",
  repo: "IsleMap",
});

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const UPDATER_DOWNLOAD_TIMEOUT_MS = 45 * 1000;

/** @type {{ state: UpdateState, version?: string, latestVersion?: string, message?: string, percent?: number, releaseUrl?: string, installerUrl?: string, forceUpdate?: boolean }} */
let lastStatus = { state: "idle", version: undefined, forceUpdate: false };
/** @type {string | null} */
let downloadedInstallerPath = null;
/** @type {any} */
let lastUpdateCheckResult = null;
/** @type {((status: typeof lastStatus) => void) | null} */
let forceUpdateHandler = null;
let autoDownloadStartedFor = null;

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

function computeForceUpdate(state, latestVersion) {
  if (!app.isPackaged) return false;
  if (!latestVersion || compareSemver(latestVersion, currentVersion()) <= 0) {
    return false;
  }
  return (
    state === "available" ||
    state === "downloading" ||
    state === "ready" ||
    state === "error"
  );
}

function broadcastStatus(status) {
  const merged = {
    version: currentVersion(),
    packaged: app.isPackaged,
    github: { ...GITHUB },
    ...lastStatus,
    ...status,
  };
  merged.forceUpdate = computeForceUpdate(
    merged.state,
    merged.latestVersion
  );
  lastStatus = merged;

  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send("updater:status", lastStatus);
    }
  }

  try {
    forceUpdateHandler?.(lastStatus);
  } catch (err) {
    console.warn("[updater] force handler", err);
  }

  // Packaged builds: begin download as soon as an update is required
  if (
    app.isPackaged &&
    lastStatus.forceUpdate &&
    lastStatus.state === "available" &&
    lastStatus.latestVersion &&
    autoDownloadStartedFor !== lastStatus.latestVersion
  ) {
    autoDownloadStartedFor = lastStatus.latestVersion;
    setTimeout(() => {
      downloadUpdate().catch((err) => {
        console.warn("[updater] auto-download failed", err);
      });
    }, 400);
  }

  return lastStatus;
}

function setForceUpdateHandler(fn) {
  forceUpdateHandler = typeof fn === "function" ? fn : null;
}

function isForceUpdateRequired() {
  return Boolean(lastStatus.forceUpdate);
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

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
  const asset = (data.assets || []).find((a) => /\.exe$/i.test(a.name || ""));
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
      message: `Version ${latestVersion} is available.`,
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

  try {
    autoUpdater.verifyUpdateCodeSignature = false;
  } catch {
    /* ignore */
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
      broadcastStatus({
        state: "error",
        message: String(err?.message || err || "Update failed"),
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
    const result = await withTimeout(
      autoUpdater.checkForUpdates(),
      20000,
      "Update check"
    );
    lastUpdateCheckResult = result;
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
    lastUpdateCheckResult = null;
    if (githubStatus) return githubStatus;
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
    state: lastStatus.state === "downloading" ? "available" : lastStatus.state,
    message: "Opened installer download in your browser.",
  });
}

/**
 * Reliable GitHub asset download with progress (avoids electron-updater hangs).
 */
async function downloadInstallerDirect(version) {
  const ver = String(version || lastStatus.latestVersion || "").replace(/^v/i, "");
  if (!ver) throw new Error("No version to download");

  const url = lastStatus.installerUrl || installerUrlFor(ver);
  const dest = path.join(app.getPath("temp"), `IsleMap-Setup-${ver}.exe`);

  broadcastStatus({
    state: "downloading",
    percent: 0,
    latestVersion: ver,
    releaseUrl: lastStatus.releaseUrl || releasePageUrl(`v${ver}`),
    installerUrl: url,
    message: "Downloading installer…",
  });

  const res = await withTimeout(
    net.fetch(url, { redirect: "follow" }),
    30000,
    "Installer request"
  );
  if (!res.ok) {
    throw new Error(`Download failed (HTTP ${res.status})`);
  }

  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || typeof res.body.getReader !== "function") {
    const buf = Buffer.from(await withTimeout(res.arrayBuffer(), DOWNLOAD_TIMEOUT_MS, "Installer download"));
    fs.writeFileSync(dest, buf);
    broadcastStatus({
      state: "downloading",
      percent: 100,
      latestVersion: ver,
      releaseUrl: lastStatus.releaseUrl,
      installerUrl: url,
      message: "Download complete.",
    });
  } else {
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    const started = Date.now();

    for (;;) {
      if (Date.now() - started > DOWNLOAD_TIMEOUT_MS) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        throw new Error("Installer download timed out");
      }
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
      received += value.length;
      const percent = total
        ? Math.min(99, (received / total) * 100)
        : Math.min(95, (received / (95 * 1024 * 1024)) * 100);
      broadcastStatus({
        state: "downloading",
        percent,
        latestVersion: ver,
        releaseUrl: lastStatus.releaseUrl,
        installerUrl: url,
        message: total
          ? `Downloading… ${Math.floor(percent)}% (${Math.round(received / 1048576)} MB)`
          : `Downloading… ${Math.round(received / 1048576)} MB`,
      });
    }

    fs.writeFileSync(dest, Buffer.concat(chunks));
  }

  downloadedInstallerPath = dest;
  return dest;
}

async function tryElectronUpdaterDownload() {
  const autoUpdater = wireAutoUpdater();
  // Must have a fresh check result or downloadUpdate can hang forever
  const result = await withTimeout(
    autoUpdater.checkForUpdates(),
    20000,
    "Pre-download update check"
  );
  lastUpdateCheckResult = result;
  const info = result?.updateInfo;
  if (!info?.version || compareSemver(info.version, currentVersion()) <= 0) {
    throw new Error("No electron-updater package available");
  }

  await withTimeout(
    autoUpdater.downloadUpdate(result.cancellationToken),
    UPDATER_DOWNLOAD_TIMEOUT_MS,
    "In-app updater download"
  );
  return lastStatus;
}

async function downloadUpdate() {
  if (!app.isPackaged) {
    return openInstallerDownload();
  }

  if (lastStatus.state !== "available" && lastStatus.state !== "error" && lastStatus.state !== "ready") {
    await checkForUpdates();
  }

  const version = lastStatus.latestVersion;
  if (!version || compareSemver(version, currentVersion()) <= 0) {
    return broadcastStatus({
      state: "current",
      latestVersion: currentVersion(),
      message: "You’re on the latest version.",
      releaseUrl: releasePageUrl(),
    });
  }

  broadcastStatus({
    state: "downloading",
    percent: 0,
    latestVersion: version,
    releaseUrl: lastStatus.releaseUrl || releasePageUrl(`v${version}`),
    installerUrl: lastStatus.installerUrl || installerUrlFor(version),
    message: "Starting download…",
  });

  // 1) Prefer direct GitHub download (progress + no hang)
  try {
    const dest = await downloadInstallerDirect(version);
    broadcastStatus({
      state: "ready",
      percent: 100,
      latestVersion: version,
      releaseUrl: lastStatus.releaseUrl || releasePageUrl(`v${version}`),
      installerUrl: lastStatus.installerUrl || installerUrlFor(version),
      message: `Version ${version} downloaded. Click Restart & install (or the installer will open).`,
    });
    // Launch installer shortly after so the user sees progress complete
    setTimeout(() => {
      shell.openPath(dest).catch((err) => console.warn("[updater] openPath", err));
    }, 400);
    return lastStatus;
  } catch (directErr) {
    console.warn("[updater] direct download failed", directErr);
  }

  // 2) Short try via electron-updater
  try {
    await tryElectronUpdaterDownload();
    if (lastStatus.state === "ready") return lastStatus;
  } catch (updaterErr) {
    console.warn("[updater] electron-updater download failed", updaterErr);
  }

  // 3) Browser fallback — never leave the UI stuck on Downloading
  await openInstallerDownload();
  return broadcastStatus({
    state: "available",
    latestVersion: version,
    releaseUrl: lastStatus.releaseUrl || releasePageUrl(`v${version}`),
    installerUrl: lastStatus.installerUrl || installerUrlFor(version),
    message:
      "In-app download didn’t finish — opened the installer in your browser. Run it to update.",
  });
}

function installUpdate() {
  if (!app.isPackaged) {
    openInstallerDownload();
    return { ok: false, reason: "not-packaged" };
  }

  if (downloadedInstallerPath && fs.existsSync(downloadedInstallerPath)) {
    shell.openPath(downloadedInstallerPath).catch((err) => {
      console.error("[updater] open downloaded installer", err);
      openInstallerDownload();
    });
    return { ok: true, mode: "direct" };
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
  return { ok: true, mode: "electron-updater" };
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
  setForceUpdateHandler,
  isForceUpdateRequired,
};
