/**
 * db.js — Setup de la base de datos SQLite del servidor de licencias
 *
 * Tabla licenses:
 *   key          TEXT  — clave con formato XXXX-XXXX-XXXX-XXXX
 *   machine_id   TEXT  — fingerprint de la PC donde se activó (null = sin activar)
 *   label        TEXT  — etiqueta opcional (ej: "Kiosco Don Juan")
 *   activated_at TEXT  — fecha/hora de activación
 *   expires_at   TEXT  — fecha de vencimiento (null = sin vencimiento)
 *   revoked      INT   — 0 activa | 1 revocada
 *   created_at   TEXT
 */

const Database = require('better-sqlite3')
const path     = require('path')

const DB_PATH = path.join(__dirname, 'licenses.db')

let _db
function getDB() {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS licenses (
        key          TEXT PRIMARY KEY,
        machine_id   TEXT,
        label        TEXT,
        activated_at TEXT,
        expires_at   TEXT,
        revoked      INTEGER NOT NULL DEFAULT 0,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }
  return _db
}

module.exports = { getDB }
