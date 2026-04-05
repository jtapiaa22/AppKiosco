/**
 * migrate.js — Corre todas las migraciones SQL en orden.
 * Cada migración se ejecuta una sola vez (se registra en _migrations).
 * Los errores de ALTER TABLE por columna ya existente se ignoran
 * de forma segura: SQLite arroja SQLITE_ERROR con mensaje 'duplicate column name'.
 */
const Database = require('better-sqlite3')
const path     = require('path')
const fs       = require('fs')

const DB_PATH  = path.join(__dirname, '..', 'kiosco.db')
const MIGS_DIR = path.join(__dirname, 'migrations')

const db = new Database(DB_PATH)

// Tabla de control de migraciones
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name       TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`)

const applied = new Set(
  db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
)

const files = fs.readdirSync(MIGS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort()

for (const file of files) {
  if (applied.has(file)) {
    console.log(`  ✓ ${file} (ya aplicada)`)
    continue
  }

  const sql = fs.readFileSync(path.join(MIGS_DIR, file), 'utf8')

  // Ejecutar cada sentencia por separado para poder ignorar
  // errores de "duplicate column name" sin abortar todo
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  db.transaction(() => {
    for (const stmt of statements) {
      try {
        db.exec(stmt)
      } catch (e) {
        // Ignorar solo errores de columna duplicada
        if (e.message.includes('duplicate column name')) {
          console.log(`    ↷ columna ya existe, ignorando: ${stmt.substring(0, 60)}...`)
        } else {
          throw e
        }
      }
    }
    db.prepare('INSERT OR IGNORE INTO _migrations (name) VALUES (?)').run(file)
  })()

  console.log(`  ✅ ${file}`)
}

console.log('\n✔ Migraciones completadas.')
db.close()
