import { useState, useEffect } from 'react'

function formatFecha(str) {
  try {
    const d = new Date(str)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return str
  }
}

function TarjetaMovimiento({ mov }) {
  const [expandido, setExpandido] = useState(false)
  // useVenta.js guarda tipo='deuda' para fiados, tipo='abono' para pagos
  const esFiado   = mov.tipo === 'deuda'
  const esAbono   = mov.tipo === 'abono'
  const tieneItems = esFiado && mov.items?.length > 0

  return (
    <div className={`rounded-xl border ${
      esFiado
        ? 'bg-red-500/8 border-red-500/15'
        : 'bg-emerald-500/8 border-emerald-500/15'
    }`}>
      {/* Fila principal */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{esFiado ? '\u2193' : '\u2191'}</span>
            <span className={`text-xs font-medium uppercase tracking-wider
              ${esFiado ? 'text-red-400' : 'text-emerald-400'}`}>
              {esFiado ? 'Fiado' : 'Abono'}
            </span>
          </div>
          {mov.nota && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{mov.nota}</p>
          )}
          <p className="text-xs text-gray-600 mt-0.5 font-mono">
            {formatFecha(mov.registrado_en)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm font-bold font-mono
            ${esFiado ? 'text-red-400' : 'text-emerald-400'}`}>
            {esFiado ? '-' : '+'}${mov.monto.toLocaleString('es-AR')}
          </span>

          {tieneItems && (
            <button
              onClick={() => setExpandido(v => !v)}
              className="w-5 h-5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-400
                         hover:text-white flex items-center justify-center transition-colors text-xs"
              title={expandido ? 'Ocultar detalle' : 'Ver productos'}
            >
              {expandido ? '\u25B2' : '\u25BC'}
            </button>
          )}
        </div>
      </div>

      {/* Detalle de productos expandible */}
      {tieneItems && expandido && (
        <div className="border-t border-red-500/10 px-3 pb-2.5 pt-2 space-y-1">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1.5">Productos</p>
          {mov.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-gray-600 font-mono text-xs w-5 text-right flex-shrink-0">
                  {item.cantidad}x
                </span>
                <span className="text-xs text-gray-300 truncate">
                  {item.producto_nombre || 'Producto eliminado'}
                </span>
              </div>
              <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                ${item.subtotal.toLocaleString('es-AR')}
              </span>
            </div>
          ))}
          <div className="flex justify-between pt-1 border-t border-gray-700/50">
            <span className="text-xs text-gray-500">Total</span>
            <span className="text-xs font-bold font-mono text-red-400">
              ${mov.monto.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
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

        {tieneDeuda && (
          <button onClick={() => onAbono(cliente)}
            className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-white text-sm font-bold transition-colors">
            💵 Registrar abono
          </button>
        )}
      </div>

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
              <TarjetaMovimiento key={mov.id} mov={mov} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
