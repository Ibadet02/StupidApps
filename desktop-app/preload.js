const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onGlobalKeypress: (callback) => {
    ipcRenderer.on("global-keypress", (_, data) => callback(data));
  },
  onListeningChanged: (callback) => {
    ipcRenderer.on("listening-changed", (_, value) => callback(value));
  },
  toggleListening: (value) => {
    ipcRenderer.send("toggle-listening", value);
  },
  getSoundsPath: () => ipcRenderer.invoke("get-sounds-path"),
  quitApp: () => ipcRenderer.send("quit-app"),
  getLicense: () => ipcRenderer.invoke("get-license"),
  saveLicense: (key) => ipcRenderer.invoke("save-license", key),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  licenseVerified: () => ipcRenderer.send("license-verified"),
});
