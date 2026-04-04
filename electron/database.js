// Singleton de SQLite — se inicializa una sola vez
// Corre en el proceso main (Node.js), nunca expuesto al renderer
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let db

function getDB() {
  if (!db) {
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'kiosco.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL') // Mejor performance en escritura concurrente
    db.pragma('foreign_keys = ON')  // Integridad referencial
    runMigrations(db)
  }
  return db
}

function runMigrations(db) {
  const migrationsDir = path.join(__dirname, '../database/migrations')
  if (!fs.existsSync(migrationsDir)) return

  // Tabla de control de migraciones
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    run_at TEXT DEFAULT (datetime('now'))
  )`)

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  )

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    db.exec(sql)
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file)
    console.log(`[DB] Migración aplicada: ${file}`)
  }
}

module.exports = { getDB }