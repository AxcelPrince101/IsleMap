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
  quitApp() {
    return ipcRenderer.invoke("dashboard:quit");
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
  openInstallerDownload() {
    return ipcRenderer.invoke("updater:open-installer");
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
  canEditPlaces() {
    return ipcRenderer.invoke("places:can-edit");
  },
  getPlaces() {
    return ipcRenderer.invoke("places:get");
  },
  savePlaces(payload) {
    return ipcRenderer.invoke("places:save", payload);
  },
  onPlacesUpdated(callback) {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("places:updated", handler);
    return () => ipcRenderer.removeListener("places:updated", handler);
  },
  getGroupStatus() {
    return ipcRenderer.invoke("group:status");
  },
  setGroupUsername(name) {
    return ipcRenderer.invoke("group:set-username", name);
  },
  createGroup() {
    return ipcRenderer.invoke("group:create");
  },
  joinGroup(code) {
    return ipcRenderer.invoke("group:join", code);
  },
  leaveGroup() {
    return ipcRenderer.invoke("group:leave");
  },
  kickGroupMember(pcId) {
    return ipcRenderer.invoke("group:kick", pcId);
  },
  getGroupIdentity() {
    return ipcRenderer.invoke("group:identity");
  },
  onGroupStatus(callback) {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on("group:status", handler);
    return () => ipcRenderer.removeListener("group:status", handler);
  },
  getOnlineStatus() {
    return ipcRenderer.invoke("online:status");
  },
  onOnlineStatus(callback) {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on("online:status", handler);
    return () => ipcRenderer.removeListener("online:status", handler);
  },
});
