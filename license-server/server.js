/**
 * server.js — API de licencias para KioscoApp
 *
 * Endpoints:
 *   POST /api/license/validate  { key, machine_id }
 *   POST /api/license/activate  { key, machine_id }
 *   GET  /api/admin/licenses    (requiere header X-Admin-Token)
 *
 * Variables de entorno:
 *   PORT             (default 4000)
 *   ADMIN_TOKEN      token secreto para el panel admin (CAMBIAR en producción)
 */

const express = require('express')
const { getDB } = require('./db')

const app        = express()
const PORT       = process.env.PORT || 4000
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'CAMBIAR_TOKEN_ADMIN_SECRETO'

app.use(express.json())

// ---------------------------------------------------------------------------
// Middleware de logging
// ---------------------------------------------------------------------------
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ---------------------------------------------------------------------------
// POST /api/license/validate
// Valida si una clave sigue activa para la máquina que la tiene registrada.
// ---------------------------------------------------------------------------
app.post('/api/license/validate', (req, res) => {
  const { key, machine_id } = req.body

  if (!key || !machine_id) {
    return res.json({ valid: false, reason: 'missing_fields' })
  }

  const db      = getDB()
  const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  if (!license) {
    return res.json({ valid: false, reason: 'not_found' })
  }

  if (license.revoked) {
    return res.json({ valid: false, reason: 'revoked' })
  }

  // Verificar vencimiento
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return res.json({ valid: false, reason: 'expired' })
  }

  // La clave no está activada aún (no debería pasar en validate, pero por si acaso)
  if (!license.machine_id) {
    return res.json({ valid: false, reason: 'not_activated' })
  }

  // Verificar que la máquina coincide
  if (license.machine_id !== machine_id) {
    return res.json({ valid: false, reason: 'machine_mismatch' })
  }

  return res.json({
    valid: true,
    info: {
      label:      license.label,
      expires_at: license.expires_at,
      key:        key.slice(0, 4) + '-****-****-' + key.slice(-4),
    },
  })
})

// ---------------------------------------------------------------------------
// POST /api/license/activate
// Activa una clave vinculándola a una máquina específica.
// Una clave solo puede activarse en UNA máquina. Si se intenta en otra → error.
// ---------------------------------------------------------------------------
app.post('/api/license/activate', (req, res) => {
  const { key, machine_id } = req.body

  if (!key || !machine_id) {
    return res.json({ valid: false, reason: 'missing_fields' })
  }

  const db      = getDB()
  const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  if (!license) {
    return res.json({ valid: false, reason: 'not_found' })
  }

  if (license.revoked) {
    return res.json({ valid: false, reason: 'revoked' })
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return res.json({ valid: false, reason: 'expired' })
  }

  // Ya activada en OTRA máquina → rechazar
  if (license.machine_id && license.machine_id !== machine_id) {
    return res.json({ valid: false, reason: 'already_used' })
  }

  // Primera activación o reactivación en la misma máquina
  db.prepare(`
    UPDATE licenses
    SET machine_id = ?, activated_at = datetime('now')
    WHERE key = ?
  `).run(machine_id, key)

  const updated = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)

  return res.json({
    valid: true,
    info: {
      label:      updated.label,
      expires_at: updated.expires_at,
      key:        key.slice(0, 4) + '-****-****-' + key.slice(-4),
    },
  })
})

// ---------------------------------------------------------------------------
// GET /api/admin/licenses  (protegido por token)
// Lista todas las licencias. Para uso del admin.
// ---------------------------------------------------------------------------
app.get('/api/admin/licenses', (req, res) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const licenses = getDB().prepare(`
    SELECT key, label, machine_id, activated_at, expires_at, revoked, created_at
    FROM licenses ORDER BY created_at DESC
  `).all()

  return res.json({ licenses })
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.listen(PORT, () => {
  console.log(`\n🔑  KioscoApp License Server corriendo en http://localhost:${PORT}`)
  console.log(`    Admin token: ${ADMIN_TOKEN}\n`)
})
