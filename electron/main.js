const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { getDB } = require('./database')
const { validateLicense } = require('./license')

const isDev = process.env.NODE_ENV === 'development'
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
  isDev
    ? mainWindow.loadURL('http://localhost:5173')
    : mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  if (isDev) mainWindow.webContents.openDevTools()
}

// IPC: base de datos
ipcMain.handle('db:query', (_, sql, params = []) => {
  return getDB().prepare(sql).all(params)
})
ipcMain.handle('db:run', (_, sql, params = []) => {
  const stmt = getDB().prepare(sql)
  const res = stmt.run(params)
  return { changes: res.changes, lastInsertRowid: res.lastInsertRowid }
})

// IPC: licencia
ipcMain.handle('license:validate', () => validateLicense())
ipcMain.handle('license:activate', (_, key) => validateLicense(key))

// IPC: app
ipcMain.handle('app:version', () => app.getVersion())

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
