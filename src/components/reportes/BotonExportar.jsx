/**
 * BotonExportar.jsx
 *
 * Botón con dropdown para exportar el reporte actual en CSV o PDF.
 * Se integra en el header de Reportes.jsx.
 *
 * Props:
 *   datos   — objeto que devuelve useReportes (resumen, topProductos, etc.)
 *   periodo — string 'hoy' | 'semana' | 'mes'
 */
import { useState, useRef, useEffect } from 'react'
import { exportarCSV, exportarPDF } from '@/services/exportar'
import toast from 'react-hot-toast'

export default function BotonExportar({ datos, periodo }) {
  const [abierto,    setAbierto]    = useState(false)
  const [exportando, setExportando] = useState(null) // null | 'csv' | 'pdf'
  const ref = useRef(null)

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function manejar(tipo) {
    if (!datos) return
    setAbierto(false)
    setExportando(tipo)
    try {
      if (tipo === 'csv') {
        await exportarCSV(datos, periodo)
        toast.success('CSV exportado correctamente')
      } else {
        await exportarPDF(datos, periodo)
        toast.success('PDF exportado correctamente')
      }
    } catch (err) {
      console.error('[Exportar]', err)
      toast.error(err.message || 'Error al exportar')
    } finally {
      setExportando(null)
    }
  }

  const ocupado = exportando !== null

  return (
    <div className="relative" ref={ref}>
      {/* Botón principal */}
      <button
        onClick={() => setAbierto(v => !v)}
        disabled={ocupado || !datos}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium
                    transition-all select-none
                    ${ ocupado || !datos
                      ? 'opacity-40 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-400'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
      >
        {ocupado ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent
                           rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        {ocupado ? (exportando === 'csv' ? 'Exportando CSV...' : 'Generando PDF...') : 'Exportar'}
        {!ocupado && (
          <svg className={`w-3 h-3 transition-transform ${ abierto ? 'rotate-180' : '' }`}
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {abierto && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-gray-900 border border-gray-700
                        rounded-xl shadow-2xl overflow-hidden z-50">

          <button
            onClick={() => manejar('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300
                       hover:bg-gray-800 hover:text-white transition-colors text-left"
          >
            {/* Icono CSV */}
            <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25
                             flex items-center justify-center text-emerald-400 text-xs font-bold
                             flex-shrink-0">
              CSV
            </span>
            <div>
              <p className="font-medium">Exportar CSV</p>
              <p className="text-xs text-gray-500">Planilla editable</p>
            </div>
          </button>

          <div className="mx-3 border-t border-gray-800" />

          <button
            onClick={() => manejar('pdf')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300
                       hover:bg-gray-800 hover:text-white transition-colors text-left"
          >
            {/* Icono PDF */}
            <span className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/25
                             flex items-center justify-center text-red-400 text-xs font-bold
                             flex-shrink-0">
              PDF
            </span>
            <div>
              <p className="font-medium">Exportar PDF</p>
              <p className="text-xs text-gray-500">Listo para imprimir</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
