const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs   = require('fs')
const { getDB }                              = require('./database')
const { validateLicense, activateLicense, getMachineId } = require('./license')

/**
 * Detección de modo desarrollo:
 *  1. Variable explícita ELECTRON_IS_DEV=1  (la setea el script dev:electron)
 *  2. Si el dist/index.html no existe todavía (primer arranque sin build)
 */
const distIndex = path.join(__dirname, '../dist/index.html')
const isDev =
  process.env.ELECTRON_IS_DEV === '1' ||
  !fs.existsSync(distIndex)

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
    console.log('[Electron] Modo DEV → http://localhost:5173')
  } else {
    mainWindow.loadFile(distIndex)
    console.log('[Electron] Modo PROD →', distIndex)
  }
}

// IPC: base de datos
ipcMain.handle('db:query', (_, sql, params = []) => {
  return getDB().prepare(sql).all(params)
})
ipcMain.handle('db:run', (_, sql, params = []) => {
  const stmt = getDB().prepare(sql)
  const res  = stmt.run(params)
  return { changes: res.changes, lastInsertRowid: res.lastInsertRowid }
})

// IPC: licencia
ipcMain.handle('license:validate',    ()        => validateLicense())
ipcMain.handle('license:activate',    (_, key)  => activateLicense(key))
ipcMain.handle('license:getMachineId', ()       => getMachineId())

// IPC: app
ipcMain.handle('app:version', () => app.getVersion())

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
