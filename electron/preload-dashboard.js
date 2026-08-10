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
  onNeedLocationSetup(callback) {
    const handler = () => callback();
    ipcRenderer.on("dashboard:need-location-setup", handler);
    return () =>
      ipcRenderer.removeListener("dashboard:need-location-setup", handler);
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
  setPlayerFullscreen(enabled) {
    return ipcRenderer.invoke("dashboard:player-fullscreen", Boolean(enabled));
  },
  isPlayerFullscreen() {
    return ipcRenderer.invoke("dashboard:player-fullscreen-state");
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
  getPrimalPinasStatus() {
    return ipcRenderer.invoke("dashboard:primal-pinas-status");
  },
  getPrimalPinasRoster() {
    return ipcRenderer.invoke("dashboard:primal-pinas-roster");
  },
  onPrimalPinasStatus(callback) {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on("dashboard:primal-pinas-status", handler);
    return () =>
      ipcRenderer.removeListener("dashboard:primal-pinas-status", handler);
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
  getGlobalPlayers() {
    return ipcRenderer.invoke("global:players");
  },
  refreshGlobalPlayers() {
    return ipcRenderer.invoke("global:refresh-players");
  },
  onGlobalPlayers(callback) {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on("global:players", handler);
    return () => ipcRenderer.removeListener("global:players", handler);
  },
  takeScreenshot(kind) {
    return ipcRenderer.invoke("screenshot:take", kind);
  },
  listScreenshots(filter) {
    return ipcRenderer.invoke("screenshot:list", filter);
  },
  readScreenshot(name) {
    return ipcRenderer.invoke("screenshot:read", name);
  },
  deleteScreenshot(name) {
    return ipcRenderer.invoke("screenshot:delete", name);
  },
  revealScreenshot(name) {
    return ipcRenderer.invoke("screenshot:reveal", name);
  },
  openScreenshotsFolder() {
    return ipcRenderer.invoke("screenshot:open-folder");
  },
  getScreenshotsDir() {
    return ipcRenderer.invoke("screenshot:dir");
  },
  onScreenshotsUpdated(callback) {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("screenshot:updated", handler);
    return () => ipcRenderer.removeListener("screenshot:updated", handler);
  },
  getRecordingSource() {
    return ipcRenderer.invoke("recording:get-source");
  },
  reportRecordingState(state) {
    return ipcRenderer.invoke("recording:report-state", state);
  },
  getRecordingState() {
    return ipcRenderer.invoke("recording:state");
  },
  recordingCommand(action) {
    return ipcRenderer.invoke("recording:command", action);
  },
  openRecordingsFolder() {
    return ipcRenderer.invoke("recording:open-folder");
  },
  getRecordingsDir() {
    return ipcRenderer.invoke("recording:dir");
  },
  listRecordings() {
    return ipcRenderer.invoke("recording:list");
  },
  deleteRecording(name) {
    return ipcRenderer.invoke("recording:delete", name);
  },
  revealRecording(name) {
    return ipcRenderer.invoke("recording:reveal", name);
  },
  openRecording(name) {
    return ipcRenderer.invoke("recording:open", name);
  },
  onRecordingState(callback) {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on("recording:state", handler);
    return () => ipcRenderer.removeListener("recording:state", handler);
  },
  getRecordingDebug() {
    return ipcRenderer.invoke("recording:debug");
  },
  probeRecording(name) {
    return ipcRenderer.invoke("recording:probe", name);
  },
  onRecordingsUpdated(callback) {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("recording:updated", handler);
    return () => ipcRenderer.removeListener("recording:updated", handler);
  },
  shareMedia(payload) {
    return ipcRenderer.invoke("share:media", payload);
  },
});
