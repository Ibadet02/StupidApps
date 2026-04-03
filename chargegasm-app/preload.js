const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onChargeEvent: (callback) => {
    ipcRenderer.on("charge-event", (_, type) => callback(type));
  },
  onEnabledChanged: (callback) => {
    ipcRenderer.on("enabled-changed", (_, value) => callback(value));
  },
  toggleEnabled: (value) => ipcRenderer.send("toggle-enabled", value),
  getSoundsPath: () => ipcRenderer.invoke("get-sounds-path"),
  loadSoundFile: (filePath) => ipcRenderer.invoke("load-sound-file", filePath),
  getLicense: () => ipcRenderer.invoke("get-license"),
  saveLicense: (key) => ipcRenderer.invoke("save-license", key),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  minimizeApp: () => ipcRenderer.send("minimize-app"),
  quitApp: () => ipcRenderer.send("quit-app"),
});
