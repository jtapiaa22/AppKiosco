#!/usr/bin/env node
/**
 * admin.js — CLI para gestionar licencias desde la terminal
 *
 * Uso:
 *   node admin.js gen [--label "Kiosco Don Juan"] [--expires 2026-12-31]
 *   node admin.js list
 *   node admin.js revoke <KEY>
 *   node admin.js reset <KEY>       # desvincula la máquina (para reinstalaciones)
 *   node admin.js info <KEY>
 */

const { getDB } = require('./db')

// Genera una clave con formato XXXX-XXXX-XXXX-XXXX usando chars seguros
function generateKey() {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O,0,I,1 para evitar confusión visual
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${segment()}-${segment()}-${segment()}-${segment()}`
}

function ensureUnique(db, key) {
  const exists = db.prepare('SELECT 1 FROM licenses WHERE key = ?').get(key)
  return exists ? generateKey() : key  // recursión implícita si colisiona (extremadamente raro)
}

const [,, command, ...args] = process.argv

const db = getDB()

switch (command) {

  // ---- gen ---------------------------------------------------------------
  case 'gen': {
    // Parsear flags opcionales
    const labelIdx   = args.indexOf('--label')
    const expiresIdx = args.indexOf('--expires')
    const label      = labelIdx   >= 0 ? args[labelIdx + 1]   : null
    const expires    = expiresIdx >= 0 ? args[expiresIdx + 1] : null

    let key = generateKey()
    key = ensureUnique(db, key)  // garantizar unicidad en la DB

    db.prepare(`
      INSERT INTO licenses (key, label, expires_at)
      VALUES (?, ?, ?)
    `).run(key, label || null, expires || null)

    console.log('\n✅  Clave generada exitosamente:')
    console.log(`    KEY:      ${key}`)
    console.log(`    Label:    ${label    || '(sin etiqueta)'}`)
    console.log(`    Vence:    ${expires  || '(sin vencimiento)'}\n`)
    break
  }

  // ---- list --------------------------------------------------------------
  case 'list': {
    const licenses = db.prepare(`
      SELECT key, label, machine_id, activated_at, expires_at, revoked, created_at
      FROM licenses ORDER BY created_at DESC
    `).all()

    if (licenses.length === 0) {
      console.log('\n  No hay licencias generadas aún.\n')
      break
    }

    console.log(`\n${'KEY'.padEnd(20)} ${'LABEL'.padEnd(22)} ${'ESTADO'.padEnd(12)} ${'VENCE'.padEnd(12)} MÁQUINA`)
    console.log('─'.repeat(100))
    licenses.forEach(l => {
      const estado = l.revoked ? '🔴 revocada' : l.machine_id ? '🟢 activa' : '⚪ sin activar'
      const vence  = l.expires_at ? l.expires_at.slice(0, 10) : 'nunca'
      const maq    = l.machine_id ? l.machine_id.slice(0, 16) + '…' : '—'
      console.log(`${l.key.padEnd(20)} ${(l.label || '').padEnd(22)} ${estado.padEnd(12)} ${vence.padEnd(12)} ${maq}`)
    })
    console.log()
    break
  }

  // ---- revoke ------------------------------------------------------------
  case 'revoke': {
    const key = args[0]
    if (!key) { console.error('Uso: node admin.js revoke <KEY>'); process.exit(1) }

    const res = db.prepare(`UPDATE licenses SET revoked = 1 WHERE key = ?`).run(key)
    if (res.changes === 0) {
      console.log('\n  ❌  Clave no encontrada.\n')
    } else {
      console.log(`\n  🔴  Clave ${key} revocada.\n`)
    }
    break
  }

  // ---- reset -------------------------------------------------------------
  case 'reset': {
    const key = args[0]
    if (!key) { console.error('Uso: node admin.js reset <KEY>'); process.exit(1) }

    const res = db.prepare(`UPDATE licenses SET machine_id = NULL, activated_at = NULL WHERE key = ?`).run(key)
    if (res.changes === 0) {
      console.log('\n  ❌  Clave no encontrada.\n')
    } else {
      console.log(`\n  🔄  Clave ${key} desvinculada de su máquina. Ya puede activarse en otra PC.\n`)
    }
    break
  }

  // ---- info --------------------------------------------------------------
  case 'info': {
    const key     = args[0]
    if (!key) { console.error('Uso: node admin.js info <KEY>'); process.exit(1) }

    const license = db.prepare('SELECT * FROM licenses WHERE key = ?').get(key)
    if (!license) {
      console.log('\n  ❌  Clave no encontrada.\n')
    } else {
      console.log('\n  Detalle de licencia:')
      Object.entries(license).forEach(([k, v]) => {
        console.log(`    ${k.padEnd(16)}: ${v ?? '—'}`)
      })
      console.log()
    }
    break
  }

  default:
    console.log(`
Uso:
  node admin.js gen [--label "Nombre"] [--expires YYYY-MM-DD]
  node admin.js list
  node admin.js revoke <KEY>
  node admin.js reset  <KEY>
  node admin.js info   <KEY>
`)
}
