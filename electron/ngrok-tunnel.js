/**
 * ngrok-tunnel.js
 * Levanta un túnel ngrok sobre el puerto 3001 y devuelve la URL pública HTTPS.
 * Electron NO hereda el PATH del shell, por eso buscamos rutas absolutas.
 */

const { exec, execSync } = require('child_process')
const http               = require('http')
const fs                 = require('fs')
const path               = require('path')

let tunnelUrl = null
let ngrokProc = null

// Rutas absolutas donde puede estar ngrok en Linux/Mac
const NGROK_CANDIDATES_UNIX = [
  '/usr/local/bin/ngrok',
  '/usr/bin/ngrok',
  '/snap/bin/ngrok',
  '/opt/homebrew/bin/ngrok',
  '/home/linuxbrew/.linuxbrew/bin/ngrok',
  path.join(process.env.HOME || '', '.local/bin/ngrok'),
  path.join(process.env.HOME || '', 'bin/ngrok'),
]

// Rutas absolutas donde puede estar ngrok en Windows
const NGROK_CANDIDATES_WIN = [
  path.join('C:', 'ngrok', 'ngrok.exe'),
  path.join('C:', 'Program Files', 'ngrok', 'ngrok.exe'),
  path.join('C:', 'Program Files (x86)', 'ngrok', 'ngrok.exe'),
  path.join(process.env.LOCALAPPDATA  || '', 'ngrok', 'ngrok.exe'),
  path.join(process.env.USERPROFILE   || '', 'ngrok', 'ngrok.exe'),
  path.join(process.env.USERPROFILE   || '', 'AppData', 'Local', 'ngrok', 'ngrok.exe'),
  path.join(process.env.USERPROFILE   || '', 'scoop', 'shims', 'ngrok.exe'),
]

const NGROK_CANDIDATES = process.platform === 'win32'
  ? NGROK_CANDIDATES_WIN
  : NGROK_CANDIDATES_UNIX

function findNgrok() {
  // 1. Buscar en rutas conocidas directamente
  for (const candidate of NGROK_CANDIDATES) {
    try {
      if (fs.existsSync(candidate)) {
        console.log('[ngrok] Encontrado en:', candidate)
        return candidate
      }
    } catch { /* ignorar */ }
  }

  // 2. Intentar resolución por PATH del sistema
  try {
    const cmd = process.platform === 'win32'
      ? 'where ngrok'
      : 'which ngrok || command -v ngrok'
    const shell = process.platform === 'win32' ? undefined : '/bin/bash'
    const result = execSync(cmd, {
      encoding: 'utf8',
      shell,
      env: {
        ...process.env,
        PATH: [
          process.env.PATH,
          '/usr/local/bin',
          '/usr/bin',
          '/snap/bin',
          '/opt/homebrew/bin',
        ].filter(Boolean).join(process.platform === 'win32' ? ';' : ':'),
      },
    }).trim().split('\n')[0].trim() // `where` puede devolver múltiples líneas
    if (result && fs.existsSync(result)) {
      console.log('[ngrok] Encontrado via PATH:', result)
      return result
    }
  } catch { /* ngrok no está en PATH */ }

  return null
}

function startNgrok(port = 3001) {
  return new Promise((resolve) => {
    const ngrokBin = findNgrok()

    if (!ngrokBin) {
      console.warn('[ngrok] No encontrado — modo degradado (solo LAN)')
      return resolve(null)
    }

    console.log('[ngrok] Iniciando túnel en puerto', port, 'con', ngrokBin)

    const env = {
      ...process.env,
      PATH: [
        process.env.PATH,
        '/usr/local/bin',
        '/usr/bin',
        '/snap/bin',
      ].filter(Boolean).join(process.platform === 'win32' ? ';' : ':'),
    }

    ngrokProc = exec(`"${ngrokBin}" http ${port} --log=stdout --log-format=json`, { env })
    ngrokProc.stderr?.on('data', d => console.error('[ngrok stderr]', d.toString().trim()))

    let attempts = 0
    const maxAttempts = 24  // 12 segundos

    const poll = setInterval(() => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(poll)
        console.warn('[ngrok] Timeout esperando la URL pública')
        return resolve(null)
      }

      const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            const json    = JSON.parse(data)
            const tunnels = json.tunnels || []
            const https   = tunnels.find(t => t.proto === 'https')
            if (https) {
              clearInterval(poll)
              tunnelUrl = https.public_url
              console.log('[ngrok] Túnel activo:', tunnelUrl)
              resolve(tunnelUrl)
            }
          } catch { /* API todavía no lista */ }
        })
      })
      req.on('error', () => {})
      req.setTimeout(400, () => req.destroy())
    }, 500)
  })
}

function stopNgrok() {
  if (ngrokProc) {
    ngrokProc.kill()
    ngrokProc = null
  }
  tunnelUrl = null
}

function getTunnelUrl() { return tunnelUrl }

module.exports = { startNgrok, stopNgrok, getTunnelUrl, findNgrok }
