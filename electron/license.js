/**
 * electron/license.js
 *
 * Valida y activa licencias contra el servidor propio.
 * Estrategia: online primero → gracia offline 7 días si no hay conexión.
 * Cada clave queda vinculada al machine_id de la PC al momento de activar.
 */

const Store  = require('electron-store')
const os     = require('os')
const crypto = require('crypto')

const store = new Store({ encryptionKey: 'kioscoapp_secret_store_2025_xK9m' })

// ⚠️  Cambiá esta URL por la de tu servidor desplegado (Railway, VPS, etc.)
const LICENSE_SERVER = process.env.LICENSE_SERVER_URL || 'http://localhost:4000'
const GRACE_DAYS = 7

// ---------------------------------------------------------------------------
// Fingerprint de máquina: hash estable basado en hostname + CPUs + plataforma
// ---------------------------------------------------------------------------
function getMachineId() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()?.[0]?.model || '',
    os.totalmem().toString(),
  ].join('|')
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)
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
      hostname: urlObj.hostname,
      port:     urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path:     urlObj.pathname,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout:  6000,
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
  const key       = store.get('licenseKey')
  const machineId = getMachineId()

  if (!key) return { valid: false, reason: 'no_key' }

  try {
    const result = await httpPost(`${LICENSE_SERVER}/api/license/validate`, {
      key,
      machine_id: machineId,
    })

    if (result.valid) {
      // Guardar timestamp para el período de gracia offline
      store.set('lastValidation', Date.now())
      store.set('licenseInfo', result.info)
      return { valid: true, info: result.info }
    }

    return { valid: false, reason: result.reason || 'rejected' }

  } catch (err) {
    // Sin conexión: usar gracia offline
    const last      = store.get('lastValidation', 0)
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)

    if (last > 0 && daysSince <= GRACE_DAYS) {
      return {
        valid:    true,
        offline:  true,
        daysLeft: Math.ceil(GRACE_DAYS - daysSince),
        info:     store.get('licenseInfo'),
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
      store.set('licenseKey',      key)
      store.set('lastValidation',  Date.now())
      store.set('licenseInfo',     result.info)
      return { valid: true, info: result.info }
    }

    return { valid: false, reason: result.reason || 'rejected' }

  } catch (err) {
    console.error('[License] Error al activar:', err.message)
    return { valid: false, reason: 'server_unreachable' }
  }
}

module.exports = { validateLicense, activateLicense, getMachineId }
