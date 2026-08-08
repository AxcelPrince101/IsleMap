const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("isleDashboard", {
  getSettings() {
    return ipcRenderer.invoke("settings:get");
  },
  setSettings(partial) {
    return ipcRenderer.invoke("settings:set", partial);
  },
  resetSettings() {
    return ipcRenderer.invoke("settings:reset");
  },
  onSettings(callback) {
    const handler = (_event, settings) => callback(settings);
    ipcRenderer.on("settings:updated", handler);
    return () => ipcRenderer.removeListener("settings:updated", handler);
  },
  repin() {
    return ipcRenderer.invoke("dashboard:repin");
  },
  toggleOverlay() {
    return ipcRenderer.invoke("dashboard:toggle-overlay");
  },
  isOverlayVisible() {
    return ipcRenderer.invoke("dashboard:overlay-visible");
  },
  onOverlayVisibility(callback) {
    const handler = (_event, visible) => callback(visible);
    ipcRenderer.on("overlay:visibility", handler);
    return () => ipcRenderer.removeListener("overlay:visibility", handler);
  },
  minimize() {
    return ipcRenderer.invoke("dashboard:window-minimize");
  },
  maximize() {
    return ipcRenderer.invoke("dashboard:window-maximize");
  },
  close() {
    return ipcRenderer.invoke("dashboard:window-close");
  },
  isMaximized() {
    return ipcRenderer.invoke("dashboard:window-is-maximized");
  },
  onMaximized(callback) {
    const handler = (_event, maximized) => callback(maximized);
    ipcRenderer.on("dashboard:maximized", handler);
    return () => ipcRenderer.removeListener("dashboard:maximized", handler);
  },
  listDisplays() {
    return ipcRenderer.invoke("dashboard:list-displays");
  },
  onDisplays(callback) {
    const handler = (_event, displays) => callback(displays);
    ipcRenderer.on("dashboard:displays", handler);
    return () => ipcRenderer.removeListener("dashboard:displays", handler);
  },
  getLastLocation() {
    return ipcRenderer.invoke("dashboard:last-location");
  },
  pickPlayerIcon() {
    return ipcRenderer.invoke("dashboard:pick-player-icon");
  },
  onLocation(callback) {
    const handler = (_event, coords) => callback(coords);
    ipcRenderer.on("dashboard:location", handler);
    return () => ipcRenderer.removeListener("dashboard:location", handler);
  },
  /** Unpackaged builds only — always false in packaged app */
  isDev() {
    return ipcRenderer.invoke("dashboard:is-dev");
  },
  getAppVersion() {
    return ipcRenderer.invoke("dashboard:app-version");
  },
  openExternal(url) {
    return ipcRenderer.invoke("dashboard:open-external", url);
  },
  getUpdateStatus() {
    return ipcRenderer.invoke("updater:status");
  },
  checkForUpdates() {
    return ipcRenderer.invoke("updater:check");
  },
  downloadUpdate() {
    return ipcRenderer.invoke("updater:download");
  },
  installUpdate() {
    return ipcRenderer.invoke("updater:install");
  },
  openReleasePage() {
    return ipcRenderer.invoke("updater:open-release");
  },
  onUpdateStatus(callback) {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on("updater:status", handler);
    return () => ipcRenderer.removeListener("updater:status", handler);
  },
  getDevPresets() {
    return ipcRenderer.invoke("dashboard:dev-presets");
  },
  applyDevDummyLocation(coords) {
    return ipcRenderer.invoke("dashboard:dev-dummy-location", coords);
  },
  nudgeDevDummyLocation(meters) {
    return ipcRenderer.invoke("dashboard:dev-nudge-location", meters);
  },
});
