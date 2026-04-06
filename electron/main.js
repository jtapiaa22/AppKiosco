const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const fs   = require('fs')
const { getDB }                                          = require('./database')
const { validateLicense, activateLicense, getMachineId } = require('./license')
const { startApiServer, getLocalIP }                     = require('./api-server')
const { startNgrok, stopNgrok, getTunnelUrl }            = require('./ngrok-tunnel')

// Ignorar errores de certificado SSL (necesario para ngrok en Electron)
// Esto permite que el polling a la URL ngrok funcione sin SSL handshake errors
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('ignore-ssl-errors', 'true')

const PORT     = 3001
const distIndex = path.join(__dirname, '../dist/index.html')
const isDev     =
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

  // Bypass SSL en el renderer tambien (para fetch() en React)
  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    // Solo saltear SSL para dominios ngrok
    if (request.hostname.includes('ngrok') || request.hostname.includes('ngrok-free')) {
      callback(0) // 0 = ok
    } else {
      callback(-3) // -3 = usar verificacion por defecto
    }
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
ipcMain.handle('license:validate',    ()       => validateLicense())
ipcMain.handle('license:activate',    (_, key) => activateLicense(key))
ipcMain.handle('license:getMachineId', ()      => getMachineId())

// IPC: app
ipcMain.handle('app:version', () => app.getVersion())

// IPC: URL del servidor móvil
// Devuelve la URL de ngrok si está disponible, si no la IP local (HTTP)
ipcMain.handle('api:getUrl', () => {
  const ngrok = getTunnelUrl()
  if (ngrok) return `${ngrok}/escaner`
  const ip = getLocalIP()
  return `http://${ip}:${PORT}/escaner`
})

// IPC: saber si ngrok está activo
ipcMain.handle('api:getNgrokStatus', () => {
  const url = getTunnelUrl()
  return { activo: Boolean(url), url }
})

app.whenReady().then(async () => {

  // Permisos de cámara para escaner.html (servido desde Express en localhost)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true)
    callback(false)
  })

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true
    return false
  })

  getDB()
  startApiServer(getDB)

  // Intentar levantar ngrok en background (no bloquea la UI)
  startNgrok(PORT).then(url => {
    if (url) console.log('[Main] ngrok listo:', url)
    else     console.log('[Main] ngrok no disponible, usando HTTP local')
  })

  createWindow()
})

app.on('before-quit', () => stopNgrok())
app.on('window-all-closed', () => {
  stopNgrok()
  if (process.platform !== 'darwin') app.quit()
})
