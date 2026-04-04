/**
 * database.js — Capa de acceso a datos
 *
 * En Electron (runtime real): usa window.api.db expuesto por preload.js
 * En Vite dev puro (sin Electron): usa un mock en memoria para no crashear
 */

const isElectron = typeof window !== 'undefined' && !!window.api?.db

// ── Mock en memoria para desarrollo web sin Electron ──────────────────────
const mockDB = {
  _tables: {},
  async query(sql) {
    console.debug('[MockDB] query:', sql)
    return []
  },
  async run(sql) {
    console.debug('[MockDB] run:', sql)
    return { changes: 0, lastInsertRowid: 0 }
  },
}

// ── API pública ────────────────────────────────────────────────────────────

/**
 * Ejecuta un SELECT y devuelve array de filas.
 * @param {string} sql   - Consulta SQL con placeholders ?
 * @param {any[]}  params - Valores para los placeholders
 * @returns {Promise<any[]>}
 */
export async function dbQuery(sql, params = []) {
  if (isElectron) {
    return window.api.db.query(sql, params)
  }
  return mockDB.query(sql, params)
}

/**
 * Ejecuta INSERT / UPDATE / DELETE.
 * @param {string} sql
 * @param {any[]}  params
 * @returns {Promise<{ changes: number, lastInsertRowid: number }>}
 */
export async function dbRun(sql, params = []) {
  if (isElectron) {
    return window.api.db.run(sql, params)
  }
  return mockDB.run(sql, params)
}
