// Sistema de validación de licencia mensual
// Estrategia: online primero, gracia offline de 7 días
const Store = require('electron-store')

const store = new Store({ encryptionKey: 'CAMBIAR_POR_TU_CLAVE_SECRETA_LARGA' })
const LICENSE_SERVER = 'https://tu-servidor.com/api/license'
const GRACE_DAYS = 7

async function validateLicense(activationKey = null) {
  const key = activationKey || store.get('licenseKey')
  if (!key) return { valid: false, reason: 'no_key' }

  try {
    // Importación dinámica para compatibilidad con el build
    const https = require('https')
    const result = await httpPost(`${LICENSE_SERVER}/validate`, { key })

    if (result.valid) {
      store.set('licenseKey', key)
      store.set('lastValidation', Date.now())
      store.set('licenseInfo', result)
      return { valid: true, info: result }
    }
    return { valid: false, reason: result.reason || 'rejected' }

  } catch (err) {
    // Sin conexión: período de gracia
    const last = store.get('lastValidation', 0)
    const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24)

    if (daysSince <= GRACE_DAYS) {
      return {
        valid: true,
        offline: true,
        daysLeft: Math.ceil(GRACE_DAYS - daysSince),
        info: store.get('licenseInfo'),
      }
    }
    return { valid: false, reason: 'expired_offline' }
  }
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 5000,
    }
    const req = require('https').request(options, res => {
      let body = ''
      res.on('data', c => body += c)
      res.on('end', () => { try { resolve(JSON.parse(body)) } catch { reject(new Error('parse error')) } })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.write(data)
    req.end()
  })
}

module.exports = { validateLicense }