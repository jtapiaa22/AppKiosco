/**
 * electron/backup.js
 *
 * Sistema de backup automático de kiosco.db.
 *
 * Estrategia:
 *   - Backup automático cada 24 hs desde que arranca la app
 *   - Backup manual disparado desde la UI
 *   - Se guardan los últimos N backups (por defecto 7), los más viejos se eliminan
 *   - Destino: carpeta "KioscoApp/backups" dentro de Documentos del usuario
 *   - Nombre del archivo: kiosco_YYYY-MM-DD_HH-MM-SS.db
 *   - Usa la API nativa de better-sqlite3 (.backup()) para garantizar consistencia
 *     incluso si hay transacciones en curso
 */

const path = require('path')
const fs   = require('fs')
const { app } = require('electron')

const MAX_BACKUPS    = 7      // cuántos backups conservar
const INTERVAL_MS   = 24 * 60 * 60 * 1000  // 24 horas en ms

let _backupTimer = null
let _getDB       = null   // función inyectada desde main.js

// ---------------------------------------------------------------------------
// getBackupDir — carpeta Documentos/KioscoApp/backups (se crea si no existe)
// ---------------------------------------------------------------------------
function getBackupDir() {
  const docs = app.getPath('documents')
  const dir  = path.join(docs, 'KioscoApp', 'backups')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// ---------------------------------------------------------------------------
// buildFileName — kiosco_2026-04-06_14-30-00.db
// ---------------------------------------------------------------------------
function buildFileName() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const fecha = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const hora  = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  return `kiosco_${fecha}_${hora}.db`
}

// ---------------------------------------------------------------------------
// pruneOldBackups — elimina backups más viejos si superan MAX_BACKUPS
// ---------------------------------------------------------------------------
function pruneOldBackups(dir) {
  try {
    const files = fs
      .readdirSync(dir)
      .filter(f => f.startsWith('kiosco_') && f.endsWith('.db'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)  // más recientes primero

    const toDelete = files.slice(MAX_BACKUPS)
    for (const f of toDelete) {
      fs.unlinkSync(path.join(dir, f.name))
      console.log('[Backup] Eliminado backup viejo:', f.name)
    }
  } catch (err) {
    console.warn('[Backup] Error al limpiar backups viejos:', err.message)
  }
}

// ---------------------------------------------------------------------------
// runBackup — hace el backup y devuelve { ok, path, error }
// ---------------------------------------------------------------------------
async function runBackup() {
  if (!_getDB) return { ok: false, error: 'DB no inicializada' }

  try {
    const db      = _getDB()
    const dir     = getBackupDir()
    const name    = buildFileName()
    const dest    = path.join(dir, name)

    // better-sqlite3 backup() es seguro incluso con la DB en uso
    await db.backup(dest)

    pruneOldBackups(dir)

    console.log('[Backup] ✅ Backup creado:', dest)
    return { ok: true, path: dest, name, dir }

  } catch (err) {
    console.error('[Backup] ❌ Error al hacer backup:', err.message)
    return { ok: false, error: err.message }
  }
}

// ---------------------------------------------------------------------------
// listBackups — lista los backups disponibles con nombre, fecha y tamaño
// ---------------------------------------------------------------------------
function listBackups() {
  try {
    const dir   = getBackupDir()
    const files = fs
      .readdirSync(dir)
      .filter(f => f.startsWith('kiosco_') && f.endsWith('.db'))
      .map(f => {
        const stat = fs.statSync(path.join(dir, f))
        return {
          name : f,
          path : path.join(dir, f),
          size : stat.size,
          mtime: stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime))  // más recientes primero

    return { ok: true, backups: files, dir }
  } catch (err) {
    return { ok: false, error: err.message, backups: [] }
  }
}

// ---------------------------------------------------------------------------
// initBackup — arranca el timer automático. Llamar desde main.js en app.whenReady
// ---------------------------------------------------------------------------
function initBackup(getDBFn) {
  _getDB = getDBFn

  // Primer backup: esperar 30 segundos después de arrancar (no bloquear el inicio)
  setTimeout(() => {
    runBackup()
    // Luego repetir cada 24 horas
    _backupTimer = setInterval(runBackup, INTERVAL_MS)
  }, 30 * 1000)

  console.log('[Backup] Sistema de backup automático iniciado (cada 24 hs)')
}

// ---------------------------------------------------------------------------
// stopBackup — detiene el timer (llamar en app.before-quit)
// ---------------------------------------------------------------------------
function stopBackup() {
  if (_backupTimer) {
    clearInterval(_backupTimer)
    _backupTimer = null
  }
}

module.exports = { initBackup, stopBackup, runBackup, listBackups, getBackupDir }
