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
