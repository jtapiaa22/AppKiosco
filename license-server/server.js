/**
 * server.js — API de licencias para KioscoApp
 *
 * Endpoints:
 *   POST /api/license/validate  { key, machine_id }
 *   POST /api/license/activate  { key, machine_id }
 *   POST /api/license/renew     { key, machine_id }   ← nuevo
 *   GET  /api/admin/licenses    (requiere header X-Admin-Token)
 *   POST /api/admin/revoke      { key }               (requiere header X-Admin-Token)
 *   GET  /health
 *
 * Variables de entorno (OBLIGATORIAS en producción):
 *   PORT        (default 4000)
 *   ADMIN_TOKEN token secreto para el panel admin — OBLIGATORIO, la app falla si no está seteado
 */

const express   = require('express')
const rateLimit = require('express-rate-limit')
const { getDB } = require('./db')

// ---------------------------------------------------------------------------
// Validar variables de entorno críticas antes de arrancar
// ---------------------------------------------------------------------------
if (!process.env.ADMIN_TOKEN && process.env.NODE_ENV === 'production') {
  console.error('[FATAL] La variable de entorno ADMIN_TOKEN es obligatoria en producción.')
  console.error('        Setá ADMIN_TOKEN=<token-secreto> antes de iniciar el servidor.')
  process.exit(1)
}

const app         = express()
const PORT        = process.env.PORT || 4000
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev_token_local_inseguro'

app.use(express.json())

// ---------------------------------------------------------------------------
// Rate limiting — protege contra fuerza bruta en endpoints de licencias
// Máximo 15 intentos por IP cada 15 minutos
// ---------------------------------------------------------------------------
const licenseRateLimit = rateLimit({
  windowMs : 15 * 60 * 1000,  // 15 minutos
  max      : 15,
  message  : { valid: false, reason: 'too_many_requests' },
  standardHeaders: true,
  legacyHeaders  : false,
})

// Rate limiting más estricto para activación (5 intentos / 15 min)
const activateRateLimit = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 5,
  message  : { valid: false, reason: 'too_many_requests' },
  standardHeaders: true,
  legacyHeaders  : false,
})

// ---------------------------------------------------------------------------
// Middleware de logging
// ---------------------------------------------------------------------------
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — IP: ${req.ip}`)
  next()
})

// ---------------------------------------------------------------------------
// Middleware de autenticación admin
// ---------------------------------------------------------------------------
function requireAdmin(req, res, next) {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ---------------------------------------------------------------------------
// POST /api/license/validate
// Valida si una clave sigue activa para la máquina que la tiene registrada.
// ---------------------------------------------------------------------------
app.post('/api/license/validate', licenseRateLimit, (req, res) => {
  const { key, machine_id } = req.body

  if (!key || !machine_id) {
    return res.json({ valid: false, reason: 'missing_fields' })
  }

  const db      = getDB()
  const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  if (!license)         return res.json({ valid: false, reason: 'not_found' })
  if (license.revoked)  return res.json({ valid: false, reason: 'revoked' })

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return res.json({ valid: false, reason: 'expired' })
  }

  if (!license.machine_id) {
    return res.json({ valid: false, reason: 'not_activated' })
  }

  if (license.machine_id !== machine_id) {
    return res.json({ valid: false, reason: 'machine_mismatch' })
  }

  return res.json({
    valid: true,
    info: {
      label     : license.label,
      plan      : license.plan || 'lifetime',
      expires_at: license.expires_at,
      key       : key.slice(0, 4) + '-****-****-' + key.slice(-4),
    },
  })
})

// ---------------------------------------------------------------------------
// POST /api/license/activate
// Activa una clave vincándola a una máquina específica.
// Una clave solo puede activarse en UNA máquina.
// ---------------------------------------------------------------------------
app.post('/api/license/activate', activateRateLimit, (req, res) => {
  const { key, machine_id } = req.body

  if (!key || !machine_id) {
    return res.json({ valid: false, reason: 'missing_fields' })
  }

  const db      = getDB()
  const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  if (!license)         return res.json({ valid: false, reason: 'not_found' })
  if (license.revoked)  return res.json({ valid: false, reason: 'revoked' })

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return res.json({ valid: false, reason: 'expired' })
  }

  // Ya activada en OTRA máquina → rechazar
  if (license.machine_id && license.machine_id !== machine_id) {
    return res.json({ valid: false, reason: 'already_used' })
  }

  db.prepare(`
    UPDATE licenses
    SET machine_id = ?, activated_at = datetime('now')
    WHERE key = ?
  `).run(machine_id, key)

  const updated = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  return res.json({
    valid: true,
    info: {
      label     : updated.label,
      plan      : updated.plan || 'lifetime',
      expires_at: updated.expires_at,
      key       : key.slice(0, 4) + '-****-****-' + key.slice(-4),
    },
  })
})

// ---------------------------------------------------------------------------
// POST /api/license/renew
// Renueva el timestamp de validación de una licencia activa y válida.
// Permite que la app renueve su período de gracia offline sin reactivar.
// ---------------------------------------------------------------------------
app.post('/api/license/renew', licenseRateLimit, (req, res) => {
  const { key, machine_id } = req.body

  if (!key || !machine_id) {
    return res.json({ valid: false, reason: 'missing_fields' })
  }

  const db      = getDB()
  const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  if (!license)                                return res.json({ valid: false, reason: 'not_found' })
  if (license.revoked)                         return res.json({ valid: false, reason: 'revoked' })
  if (!license.machine_id)                     return res.json({ valid: false, reason: 'not_activated' })
  if (license.machine_id !== machine_id)       return res.json({ valid: false, reason: 'machine_mismatch' })

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return res.json({ valid: false, reason: 'expired' })
  }

  return res.json({
    valid: true,
    renewed: true,
    info: {
      label     : license.label,
      plan      : license.plan || 'lifetime',
      expires_at: license.expires_at,
      key       : key.slice(0, 4) + '-****-****-' + key.slice(-4),
    },
  })
})

// ---------------------------------------------------------------------------
// GET /api/admin/licenses  (protegido)
// Lista todas las licencias para el panel admin.
// ---------------------------------------------------------------------------
app.get('/api/admin/licenses', requireAdmin, (req, res) => {
  const licenses = getDB().prepare(`
    SELECT key, label, plan, machine_id, activated_at, expires_at, revoked, created_at
    FROM licenses ORDER BY created_at DESC
  `).all()

  return res.json({ licenses })
})

// ---------------------------------------------------------------------------
// POST /api/admin/revoke  (protegido)
// Revoca una licencia por clave.
// ---------------------------------------------------------------------------
app.post('/api/admin/revoke', requireAdmin, (req, res) => {
  const { key } = req.body

  if (!key) return res.status(400).json({ error: 'missing_key' })

  const db = getDB()
  const result = db.prepare(`UPDATE licenses SET revoked = 1 WHERE key = ?`).run(key)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'not_found' })
  }

  return res.json({ ok: true, revoked: key })
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// ---------------------------------------------------------------------------
// Arrancar
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development'
  console.log(`\n🔑  KioscoApp License Server — ${env}`)
  console.log(`    Escuchando en http://localhost:${PORT}`)
  if (env !== 'production') {
    console.log(`    Admin token: ${ADMIN_TOKEN} (SOLO visible en development)\n`)
  }
})
