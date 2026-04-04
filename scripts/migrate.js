/**
 * migrate.js — Ejecuta las migraciones SQL manualmente desde CLI
 * Uso: npm run db:migrate
 *
 * Crea la DB en ./data/kiosco.dev.db (solo para desarrollo fuera de Electron)
 */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, '../data/kiosco.dev.db')
const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations')

// Crear directorio si no existe
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Tabla de control
db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
  name   TEXT PRIMARY KEY,
  run_at TEXT DEFAULT (datetime('now'))
)`)

const applied = new Set(
  db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
)

const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.log('[Migrate] No hay archivos de migración en', MIGRATIONS_DIR)
  process.exit(0)
}

let count = 0
for (const file of files) {
  if (applied.has(file)) {
    console.log(`[Migrate] ✓ Ya aplicada: ${file}`)
    continue
  }
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8')
  db.exec(sql)
  db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
  console.log(`[Migrate] ✅ Aplicada:    ${file}`)
  count++
}

console.log(`\n[Migrate] ${count} migración(es) aplicada(s). DB: ${DB_PATH}`)
db.close()
