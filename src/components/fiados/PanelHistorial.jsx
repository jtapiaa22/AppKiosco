import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// date-fns puede no estar disponible — fallback simple
function formatFecha(str) {
  try {
    const d = new Date(str)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return str
  }
}

export default function PanelHistorial({ cliente, cargarHistorial, onAbono, onEditar, onCerrar }) {
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando]   = useState(false)

  useEffect(() => {
    if (!cliente) return
    setCargando(true)
    cargarHistorial(cliente.id)
      .then(setHistorial)
      .finally(() => setCargando(false))
  }, [cliente])

  if (!cliente) return null

  const tieneDeuda = cliente.deuda_total > 0

  return (
    <div className="w-80 flex flex-col bg-gray-900 border-l border-gray-800 h-full">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-white text-base">{cliente.nombre}</h3>
            {cliente.telefono && (
              <p className="text-xs text-gray-500 font-mono mt-0.5">{cliente.telefono}</p>
            )}
            {cliente.notas && (
              <p className="text-xs text-gray-600 mt-0.5 italic">{cliente.notas}</p>
            )}
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEditar(cliente)}
              className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400
                         hover:text-white flex items-center justify-center text-xs transition-colors">✏</button>
            <button onClick={onCerrar}
              className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400
                         hover:text-white flex items-center justify-center text-xs transition-colors">✕</button>
          </div>
        </div>

        {/* Deuda actual */}
        <div className={`px-4 py-3 rounded-xl border ${
          tieneDeuda
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20'
        }`}>
          <p className="text-xs text-gray-500">Deuda actual</p>
          <p className={`text-2xl font-bold font-mono ${tieneDeuda ? 'text-red-400' : 'text-emerald-400'}`}>
            ${cliente.deuda_total.toLocaleString('es-AR')}
          </p>
          {!tieneDeuda && <p className="text-xs text-emerald-600 mt-0.5">✓ Sin deuda pendiente</p>}
        </div>

        {/* Botón abonar */}
        {tieneDeuda && (
          <button onClick={() => onAbono(cliente)}
            className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-white text-sm font-bold transition-colors">
            💵 Registrar abono
          </button>
        )}
      </div>

      {/* Historial */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Historial de movimientos</p>

        {cargando ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-gray-500 text-xs">Sin movimientos registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historial.map(mov => (
              <div key={mov.id}
                className={`px-3 py-2.5 rounded-xl border ${
                  mov.tipo === 'abono'
                    ? 'bg-emerald-500/8 border-emerald-500/15'
                    : 'bg-red-500/8 border-red-500/15'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{mov.tipo === 'abono' ? '↑' : '↓'}</span>
                      <span className={`text-xs font-medium uppercase tracking-wider
                        ${mov.tipo === 'abono' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {mov.tipo === 'abono' ? 'Abono' : 'Fiado'}
                      </span>
                    </div>
                    {mov.nota && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{mov.nota}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5 font-mono">
                      {formatFecha(mov.registrado_en)}
                    </p>
                  </div>
                  <span className={`text-sm font-bold font-mono flex-shrink-0
                    ${mov.tipo === 'abono' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {mov.tipo === 'abono' ? '+' : '-'}${mov.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}