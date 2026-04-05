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

    try {
      db.exec(sql)
      console.log(`[DB] Migraci\u00f3n aplicada: ${file}`)
    } catch (err) {
      // Si el error es de columna/tabla ya existente, lo ignoramos y
      // marcamos la migraci\u00f3n como aplicada para no volver a intentarla.
      // Esto ocurre cuando una migraci\u00f3n corri\u00f3 parcialmente y crash\u00f3
      // antes de registrarse en _migrations.
      const ignorable = [
        'duplicate column name',
        'table',
        'already exists',
      ]
      const esIgnorable = ignorable.some(msg => err.message.toLowerCase().includes(msg))

      if (esIgnorable) {
        console.warn(`[DB] Migraci\u00f3n "${file}" ya parcialmente aplicada, marcando como hecha. (${err.message})`)
      } else {
        // Error real (sintaxis, constraint, etc.) -> propagar
        throw err
      }
    }

    // Registrar como aplicada en ambos casos (\u00e9xito o ignorable)
    db.prepare('INSERT OR IGNORE INTO _migrations (name) VALUES (?)').run(file)
  }
}

module.exports = { getDB }
