/**
 * electron/license.js
 *
 * Valida y activa licencias contra el servidor propio.
 * Estrategia: online primero → gracia offline 7 días si no hay conexión.
 * Cada clave queda vinculada al machine_id de la PC al momento de activar.
 *
 * Mejoras de seguridad:
 *  - machineId basado en la dirección MAC de la placa principal (más estable)
 *  - encryptionKey del store derivada dinámicamente del machineId (no hardcodeada)
 */

const Store  = require('electron-store')
const os     = require('os')
const crypto = require('crypto')

// ✔  URL del servidor — cambiá por la de Railway/Render en producción
const LICENSE_SERVER = process.env.LICENSE_SERVER_URL || 'http://localhost:4000'
const GRACE_DAYS     = 7

// ---------------------------------------------------------------------------
// getMachineId — fingerprint estable basado en la MAC address principal
// Usa la primera interfaz de red no-interna con dirección MAC real.
// Fallback a hostname + plataforma si no hay interfaz disponible.
// ---------------------------------------------------------------------------
function getMachineId() {
  try {
    const interfaces = os.networkInterfaces()
    let mac = ''

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Ignorar loopback e interfaces sin MAC real
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          mac = iface.mac
          break
        }
      }
      if (mac) break
    }

    const seed = mac
      ? `${mac}|${os.platform()}|${os.arch()}`
      : `${os.hostname()}|${os.platform()}|${os.arch()}|${os.cpus()?.[0]?.model || ''}`

    return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 32)
  } catch {
    // Fallback mínimo en caso de error
    return crypto.createHash('sha256')
      .update(os.hostname() + os.platform())
      .digest('hex').slice(0, 32)
  }
}

// ---------------------------------------------------------------------------
// getStore — inicializa electron-store con encryptionKey derivada del machineId
// La clave NO está hardcodeada en el código: se genera en runtime a partir del
// hardware de la máquina, haciendo inviable reutilizar el store en otra PC.
// ---------------------------------------------------------------------------
function getStore() {
  const machineId     = getMachineId()
  const encryptionKey = crypto
    .createHmac('sha256', 'kioscoapp-store-v2')
    .update(machineId)
    .digest('hex')

  return new Store({ encryptionKey })
}

// Instancia única (se crea una vez y se reutiliza)
let _store = null
function store() {
  if (!_store) _store = getStore()
  return _store
}

// ---------------------------------------------------------------------------
// HTTP helper (sin dependencias externas, usa el módulo 'http'/'https' nativo)
// ---------------------------------------------------------------------------
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data    = JSON.stringify(body)
    const urlObj  = new URL(url)
    const mod     = urlObj.protocol === 'https:' ? require('https') : require('http')
    const options = {
      hostname : urlObj.hostname,
      port     : urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path     : urlObj.pathname,
      method   : 'POST',
      headers  : {
        'Content-Type'  : 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 6000,
    }
    const req = mod.request(options, res => {
      let buf = ''
      res.on('data', c => buf += c)
      res.on('end', () => {
        try { resolve(JSON.parse(buf)) }
        catch { reject(new Error('parse error')) }
      })
    })
    req.on('error',   reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.write(data)
    req.end()
  })
}

// ---------------------------------------------------------------------------
// validateLicense — se llama al arrancar la app
// ---------------------------------------------------------------------------
async function validateLicense() {
  const s         = store()
  const key       = s.get('licenseKey')
  const machineId = getMachineId()

  if (!key) return { valid: false, reason: 'no_key' }

  try {
    const result = await httpPost(`${LICENSE_SERVER}/api/license/validate`, {
      key,
      machine_id: machineId,
    })

    if (result.valid) {
      s.set('lastValidation', Date.now())
      s.set('licenseInfo', result.info)
      return { valid: true, info: result.info }
    }

    // Si el servidor rechaza la licencia, limpiar store local
    if (['revoked', 'expired', 'machine_mismatch'].includes(result.reason)) {
      s.delete('licenseKey')
      s.delete('lastValidation')
      s.delete('licenseInfo')
    }

    return { valid: false, reason: result.reason || 'rejected' }

  } catch {
    // Sin conexión: usar gracia offline
    const last      = s.get('lastValidation', 0)
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)

    if (last > 0 && daysSince <= GRACE_DAYS) {
      return {
        valid   : true,
        offline : true,
        daysLeft: Math.ceil(GRACE_DAYS - daysSince),
        info    : s.get('licenseInfo'),
      }
    }

    return { valid: false, reason: 'expired_offline' }
  }
}

// ---------------------------------------------------------------------------
// activateLicense — se llama cuando el usuario ingresa la clave
// ---------------------------------------------------------------------------
async function activateLicense(key) {
  const machineId = getMachineId()

  try {
    const result = await httpPost(`${LICENSE_SERVER}/api/license/activate`, {
      key,
      machine_id: machineId,
    })

    if (result.valid) {
      const s = store()
      s.set('licenseKey',     key)
      s.set('lastValidation', Date.now())
      s.set('licenseInfo',    result.info)
      return { valid: true, info: result.info }
    }

    return { valid: false, reason: result.reason || 'rejected' }

  } catch (err) {
    console.error('[License] Error al activar:', err.message)
    return { valid: false, reason: 'server_unreachable' }
  }
}

module.exports = { validateLicense, activateLicense, getMachineId }
