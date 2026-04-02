const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { GlobalKeyboardListener } = require("node-global-key-listener");

let mainWindow;
let tray;
let keyListener;
let isListening = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 580,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: "#0f0f1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  // Hide instead of close (keep in tray)
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Simple tray icon
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABhSURBVFhH7c4xDQAgDETRDhZwgQscIAEHuMAFDnCBA1xw6SabNBl+8pLmD18DAAAAAACAfyl7X/MesNYa8x6QUhrzHuCcG/MeYIwZ8x4gpRzzHhBjHPMe8F8AAAD4TkQfPQ0hFbVsMCkAAAAASUVORK5CYII="
  );
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Window",
      click: () => mainWindow.show(),
    },
    {
      label: isListening ? "Pause Sounds" : "Resume Sounds",
      click: () => {
        isListening = !isListening;
        mainWindow.webContents.send("listening-changed", isListening);
        createTray(); // Rebuild menu with updated label
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Typing Sound Customizer");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function startKeyListener() {
  keyListener = new GlobalKeyboardListener();

  const MOUSE_KEYS = new Set(["MOUSE LEFT", "MOUSE RIGHT", "MOUSE MIDDLE", "MOUSE X1", "MOUSE X2"]);

  keyListener.addListener((e) => {
    if (e.state === "DOWN" && !MOUSE_KEYS.has(e.name)) {
      const keyName = e.name || "UNKNOWN";
      const windowFocused = mainWindow.isFocused();
      mainWindow.webContents.send("global-keypress", { keyName, windowFocused });
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startKeyListener();

  app.on("activate", () => {
    mainWindow.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (keyListener) {
    keyListener.kill();
  }
});

// IPC handlers
ipcMain.handle("get-sounds-path", () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "sounds");
  }
  return path.join(__dirname, "sounds");
});

ipcMain.on("toggle-listening", (_, value) => {
  isListening = value;
  createTray();
});
