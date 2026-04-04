/**
 * ngrok-tunnel.js
 * Levanta un túnel ngrok sobre el puerto 3001 y devuelve la URL pública HTTPS.
 * Si ngrok no está instalado o falla, devuelve null (modo degradado).
 */

const { exec } = require('child_process')
const http      = require('http')

let tunnelUrl   = null
let ngrokProc   = null

/**
 * Intenta iniciar ngrok y obtener la URL pública.
 * Retorna la URL (string) o null si falla.
 */
function startNgrok(port = 3001) {
  return new Promise((resolve) => {
    // Verificar que ngrok esté instalado
    exec('which ngrok', (err) => {
      if (err) {
        console.warn('[ngrok] No instalado — modo degradado (solo LAN)')
        return resolve(null)
      }

      console.log('[ngrok] Iniciando túnel en puerto', port)
      ngrokProc = exec(`ngrok http ${port} --log=stdout --log-format=json`)

      // ngrok expone una API local en :4040 para obtener la URL
      // Esperamos hasta 8 segundos a que esté lista
      let attempts = 0
      const maxAttempts = 16

      const poll = setInterval(() => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(poll)
          console.warn('[ngrok] Timeout esperando la URL')
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
              // todavía no está lista, seguir esperando
            }
          })
        })
        req.on('error', () => {}) // silencioso mientras no esté lista
        req.setTimeout(500, () => req.destroy())
      }, 500)
    })
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

module.exports = { startNgrok, stopNgrok, getTunnelUrl }
