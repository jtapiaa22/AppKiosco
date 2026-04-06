/**
 * Configuracion.jsx
 *
 * Página de configuración de la app.
 * Por ahora incluye el módulo de backup; en el futuro: nombre del kiosco,
 * umbral de stock, PIN, etc.
 */

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day  : '2-digit', month: '2-digit', year : 'numeric',
    hour : '2-digit', minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function Configuracion() {
  const [backups,         setBackups]         = useState([])
  const [backupDir,       setBackupDir]       = useState('')
  const [cargando,        setCargando]        = useState(true)
  const [haciendoBackup,  setHaciendoBackup]  = useState(false)

  // Cargar lista de backups al montar
  useEffect(() => { cargarBackups() }, [])

  async function cargarBackups() {
    setCargando(true)
    try {
      if (!window.electronAPI?.backupList) {
        setBackups([])
        return
      }
      const res = await window.electronAPI.backupList()
      if (res.ok) {
        setBackups(res.backups || [])
        setBackupDir(res.dir || '')
      }
    } catch (err) {
      console.error('[Configuracion] Error al listar backups:', err)
    } finally {
      setCargando(false)
    }
  }

  async function hacerBackupManual() {
    if (haciendoBackup) return
    setHaciendoBackup(true)
    const toastId = toast.loading('Creando backup...')
    try {
      const res = await window.electronAPI.backupRun()
      if (res.ok) {
        toast.success(`Backup creado: ${res.name}`, { id: toastId })
        cargarBackups()
      } else {
        toast.error(`Error: ${res.error}`, { id: toastId })
      }
    } catch (err) {
      toast.error('No se pudo crear el backup', { id: toastId })
    } finally {
      setHaciendoBackup(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0 sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold text-white">Configuración</h1>
          <p className="text-xs text-gray-500 mt-0.5">Ajustes y herramientas de la app</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-6 max-w-3xl">

        {/* ── Sección Backup ──────────────────────────────────── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white text-sm">💾 Backup de datos</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Se realiza un backup automático cada 24 hs. Se conservan los últimos 7.
              </p>
            </div>
            <button
              onClick={hacerBackupManual}
              disabled={haciendoBackup}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500
                         text-white transition-all active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {haciendoBackup
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : '⬆ Backup ahora'
              }
            </button>
          </div>

          {/* Carpeta destino */}
          {backupDir && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-xl">
              <span className="text-gray-500 text-xs">📁 Carpeta:</span>
              <span className="text-gray-300 text-xs font-mono truncate">{backupDir}</span>
            </div>
          )}

          {/* Lista de backups */}
          {cargando ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              <p className="text-2xl mb-2">🗂</p>
              <p>Todavía no hay backups. El primero se crea automáticamente<br/>30 segundos después de abrir la app.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((b, i) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{i === 0 ? '🟢' : '⚪'}</span>
                    <div>
                      <p className="text-xs font-mono text-gray-200">{b.name}</p>
                      <p className="text-xs text-gray-500">{formatFecha(b.mtime)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{formatSize(b.size)}</span>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* ── Próximamente ───────────────────────────────────── */}
        <section className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-600 text-sm mb-3">⚙ Próximamente</h2>
          <div className="space-y-2">
            {['Nombre del kiosco', 'Umbral de alerta de stock', 'PIN de acceso / roles', 'Exportar reportes a PDF'].map(item => (
              <div key={item} className="flex items-center gap-2 text-gray-700 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-700 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
