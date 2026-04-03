const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, powerMonitor } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let tray;
let isEnabled = true;
let wasCharging = null; // null = unknown on first check

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 440,
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

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABhSURBVFhH7c4xDQAgDETRDhZwgQscIAEHuMAFDnCBA1xw6SabNBl+8pLmD18DAAAAAACAfyl7X/MesNYa8x6QUhrzHuCcG/MeYIwZ8x4gpRzzHhBjHPMe8F8AAAD4TkQfPQ0hFbVsMCkAAAAASUVORK5CYII="
  );
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isEnabled ? "Pause" : "Resume",
      click: () => {
        isEnabled = !isEnabled;
        mainWindow.webContents.send("enabled-changed", isEnabled);
        createTray();
      },
    },
    {
      label: "Show",
      click: () => mainWindow.show(),
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

  tray.setToolTip("ChargeGasm");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function getChargingStatus() {
  // macOS: use pmset (most reliable on Mac)
  if (process.platform === "darwin") {
    try {
      const { execSync } = require("child_process");
      const output = execSync("pmset -g batt", { encoding: "utf-8" });
      if (output.includes("AC Power")) return true;
      if (output.includes("Battery Power")) return false;
    } catch {}
  }

  // Linux: read directly from sysfs
  if (process.platform === "linux") {
    try {
      const files = fs.readdirSync("/sys/class/power_supply/");
      for (const name of files) {
        const onlinePath = `/sys/class/power_supply/${name}/online`;
        if (fs.existsSync(onlinePath)) {
          const val = fs.readFileSync(onlinePath, "utf-8").trim();
          return val === "1";
        }
        const statusPath = `/sys/class/power_supply/${name}/status`;
        if (fs.existsSync(statusPath)) {
          const val = fs.readFileSync(statusPath, "utf-8").trim();
          return val === "Charging" || val === "Full";
        }
      }
    } catch {}
  }

  // Fallback: Electron powerMonitor (works on all platforms)
  try {
    return !powerMonitor.isOnBatteryPower();
  } catch {}

  return null;
}

function startChargeMonitor() {
  wasCharging = getChargingStatus();
  console.log("Initial charging state:", wasCharging);

  setInterval(() => {
    if (!isEnabled) return;

    const isCharging = getChargingStatus();
    if (isCharging === null) return;

    if (wasCharging === null) {
      wasCharging = isCharging;
      return;
    }

    if (isCharging && !wasCharging) {
      console.log("PLUGGED IN!");
      mainWindow.webContents.send("charge-event", "plugged");
    } else if (!isCharging && wasCharging) {
      console.log("UNPLUGGED!");
      mainWindow.webContents.send("charge-event", "unplugged");
    }

    wasCharging = isCharging;
  }, 500); // Check every 500ms for faster response
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startChargeMonitor();

  app.on("activate", () => {
    mainWindow.show();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle("get-sounds-path", () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "sounds");
  }
  return path.join(__dirname, "sounds");
});

ipcMain.handle("load-sound-file", async (_, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return data.buffer;
  } catch {
    return null;
  }
});

// License
const licensePath = path.join(app.getPath("userData"), "license.json");

ipcMain.handle("get-license", () => {
  try {
    if (fs.existsSync(licensePath)) {
      const data = JSON.parse(fs.readFileSync(licensePath, "utf-8"));
      return data.key || null;
    }
  } catch {}
  return null;
});

ipcMain.handle("save-license", (_, key) => {
  fs.writeFileSync(licensePath, JSON.stringify({ key }), "utf-8");
  return true;
});

ipcMain.on("open-external", (_, url) => {
  require("electron").shell.openExternal(url);
});

ipcMain.on("minimize-app", () => {
  mainWindow.minimize();
});

ipcMain.on("quit-app", () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.on("toggle-enabled", (_, value) => {
  isEnabled = value;
  createTray();
});
