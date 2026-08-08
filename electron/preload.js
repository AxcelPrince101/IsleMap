const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("isleOverlay", {
  onLocation(callback) {
    const handler = (_event, coords) => callback(coords);
    ipcRenderer.on("overlay:location", handler);
    return () => ipcRenderer.removeListener("overlay:location", handler);
  },
  onClickThrough(callback) {
    const handler = (_event, enabled) => callback(enabled);
    ipcRenderer.on("overlay:click-through", handler);
    return () => ipcRenderer.removeListener("overlay:click-through", handler);
  },
  onRecenter(callback) {
    const handler = () => callback();
    ipcRenderer.on("overlay:recenter", handler);
    return () => ipcRenderer.removeListener("overlay:recenter", handler);
  },
  onToast(callback) {
    const handler = (_event, message) => callback(message);
    ipcRenderer.on("overlay:toast", handler);
    return () => ipcRenderer.removeListener("overlay:toast", handler);
  },
  onSettings(callback) {
    const handler = (_event, settings) => callback(settings);
    ipcRenderer.on("settings:updated", handler);
    return () => ipcRenderer.removeListener("settings:updated", handler);
  },
  getSettings() {
    return ipcRenderer.invoke("settings:get");
  },
  setClickThrough(enabled) {
    return ipcRenderer.invoke("overlay:set-click-through", enabled);
  },
  getClickThrough() {
    return ipcRenderer.invoke("overlay:get-click-through");
  },
  clearClipboard() {
    return ipcRenderer.invoke("overlay:clear-clipboard");
  },
  repin() {
    return ipcRenderer.invoke("overlay:repin");
  },
  openDashboard() {
    return ipcRenderer.invoke("overlay:open-dashboard");
  },
  getPlaces() {
    return ipcRenderer.invoke("places:get");
  },
  onPlacesUpdated(callback) {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on("places:updated", handler);
    return () => ipcRenderer.removeListener("places:updated", handler);
  },
});
