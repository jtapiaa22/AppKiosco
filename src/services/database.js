/**
 * database.js — Capa de acceso a datos
 *
 * En Electron: usa window.electronAPI.dbQuery / dbRun expuestos por preload.js
 * En dev web puro (sin Electron): mock en memoria para no crashear
 */

// NOTA: NO evaluar isElectron en el nivel de módulo — preload puede no haber
// inyectado window.electronAPI todavía. Se resuelve en cada llamada.
function isElectron() {
  return typeof window !== 'undefined' && typeof window.electronAPI?.dbQuery === 'function'
}

// ── Mock en memoria para desarrollo web sin Electron ─────────────────────
const mockDB = {
  async query(sql, params) {
    console.debug('[MockDB] query:', sql, params)
    return []
  },
  async run(sql, params) {
    console.debug('[MockDB] run:', sql, params)
    return { changes: 0, lastInsertRowid: 0 }
  },
}

// ── API pública ────────────────────────────────────────────

/**
 * Ejecuta un SELECT y devuelve array de filas.
 * @throws {Error} Si la comunicación IPC falla en el proceso principal.
 */
export async function dbQuery(sql, params = []) {
  if (isElectron()) {
    try {
      return await window.electronAPI.dbQuery(sql, params)
    } catch (err) {
      console.error('[DB] Error en dbQuery:', sql, err)
      throw new Error(`Error al consultar la base de datos: ${err.message}`)
    }
  }
  return mockDB.query(sql, params)
}

/**
 * Ejecuta INSERT / UPDATE / DELETE.
 * @throws {Error} Si la comunicación IPC falla en el proceso principal.
 */
export async function dbRun(sql, params = []) {
  if (isElectron()) {
    try {
      return await window.electronAPI.dbRun(sql, params)
    } catch (err) {
      console.error('[DB] Error en dbRun:', sql, err)
      throw new Error(`Error al ejecutar operación en la base de datos: ${err.message}`)
    }
  }
  return mockDB.run(sql, params)
}

/**
 * Devuelve el datetime local actual en formato SQLite: 'YYYY-MM-DD HH:MM:SS'
 *
 * IMPORTANTE: SQLite usa datetime('now') que retorna UTC.
 * En Argentina (UTC-3) esto causa que ventas hechas luego de las 21:00
 * queden guardadas con la fecha del día siguiente.
 *
 * Solución: siempre pasar la hora local desde JS como parámetro
 * en lugar de usar datetime('now') dentro de la query SQL.
 *
 * Uso:
 *   dbRun(`INSERT INTO ventas (..., vendido_en) VALUES (?, ?)`, [..., ahoraLocal()])
 */
export function ahoraLocal() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  )
}

/**
 * Devuelve solo la fecha local en formato 'YYYY-MM-DD'
 * (para columnas tipo `date`, como `cajas.fecha`).
 */
export function hoyLocal() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
