/**
 * ngrok-tunnel.js
 * Levanta un túnel ngrok sobre el puerto 3001 y devuelve la URL pública HTTPS.
 * Si ngrok no está instalado o falla, devuelve null (modo degradado).
 */

const { exec, execSync } = require('child_process')
const http               = require('http')
const fs                 = require('fs')
const path               = require('path')

let tunnelUrl = null
let ngrokProc = null

// Rutas donde puede estar ngrok en Linux/Mac
// Electron no hereda el PATH completo del shell, hay que buscar manualmente
const NGROK_CANDIDATES = [
  '/usr/local/bin/ngrok',
  '/usr/bin/ngrok',
  '/snap/bin/ngrok',
  '/opt/homebrew/bin/ngrok',   // macOS ARM
  '/home/linuxbrew/.linuxbrew/bin/ngrok',
  path.join(process.env.HOME || '', '.local/bin/ngrok'),
  path.join(process.env.HOME || '', 'bin/ngrok'),
]

/**
 * Encuentra la ruta absoluta de ngrok, o null si no está instalado.
 */
function findNgrok() {
  // 1. Buscar en rutas conocidas
  for (const candidate of NGROK_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      console.log('[ngrok] Encontrado en:', candidate)
      return candidate
    }
  }

  // 2. Intentar con el PATH que sí tiene Electron
  try {
    const result = execSync('which ngrok 2>/dev/null || command -v ngrok 2>/dev/null', {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/snap/bin:/opt/homebrew/bin`,
      },
    }).trim()
    if (result && fs.existsSync(result)) {
      console.log('[ngrok] Encontrado via which:', result)
      return result
    }
  } catch {
    // nada
  }

  return null
}

/**
 * Intenta iniciar ngrok y obtener la URL pública HTTPS.
 * Retorna la URL (string) o null si falla.
 */
function startNgrok(port = 3001) {
  return new Promise((resolve) => {
    const ngrokBin = findNgrok()

    if (!ngrokBin) {
      console.warn('[ngrok] No encontrado en rutas conocidas — modo degradado (solo LAN)')
      return resolve(null)
    }

    console.log('[ngrok] Iniciando túnel en puerto', port, 'con', ngrokBin)

    // PATH enriquecido para que ngrok pueda ejecutarse correctamente
    const env = {
      ...process.env,
      PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/snap/bin`,
    }

    ngrokProc = exec(`"${ngrokBin}" http ${port} --log=stdout --log-format=json`, { env })

    ngrokProc.stderr?.on('data', d => console.error('[ngrok stderr]', d.toString().trim()))

    // Consultar la API local de ngrok cada 500ms hasta obtener la URL (máx 12s)
    let attempts    = 0
    const maxAttempts = 24

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
          } catch {
            // API todavía no responde JSON válido, seguir esperando
          }
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

function getTunnelUrl() {
  return tunnelUrl
}

module.exports = { startNgrok, stopNgrok, getTunnelUrl, findNgrok }
