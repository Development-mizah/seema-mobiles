const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

let mainWindow;

// ✅ BACKUP FUNCTION
function autoBackup(data) {
  try {
    const desktopPath = path.join(os.homedir(), "Desktop");
    const backupFolder = path.join(desktopPath, "SeemaBackup");

    // Create folder if not exists
    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder);
    }

    const fileName = `${new Date().toISOString().slice(0, 7)}.json`;
    const filePath = path.join(backupFolder, fileName);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log("✅ Backup saved:", filePath);
  } catch (err) {
    console.error("❌ Backup failed:", err);
  }
}

// ✅ MONTHLY CHECK
function shouldBackup() {
  try {
    const metaPath = path.join(app.getPath("userData"), "backup-meta.json");

    if (!fs.existsSync(metaPath)) return true;

    const meta = JSON.parse(fs.readFileSync(metaPath));
    const last = meta.lastBackup;

    const now = new Date().toISOString().slice(0, 7); // YYYY-MM

    return last !== now;
  } catch {
    return true;
  }
}

function updateBackupMeta() {
  const metaPath = path.join(app.getPath("userData"), "backup-meta.json");
  const now = new Date().toISOString().slice(0, 7);

  fs.writeFileSync(metaPath, JSON.stringify({ lastBackup: now }));
}

// ✅ IPC (RECEIVE DATA FROM REACT)
ipcMain.handle("backup-data", async (event, data) => {
  if (shouldBackup()) {
    autoBackup(data);
    updateBackupMeta();
  }
});

// ✅ CREATE WINDOW
function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: isDev
      ? path.join(__dirname, "assets/icon.ico")
      : path.join(process.resourcesPath, "assets/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // ⚠️ required for IPC
      contextIsolation: true,
      nodeIntegration: false,
    },
  }); 

  mainWindow.setMenu(null);
  mainWindow.maximize();

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

// ✅ APP READY
app.whenReady().then(createWindow);

// ✅ CLOSE HANDLING
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
