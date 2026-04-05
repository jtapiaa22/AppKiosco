/**
 * TablaVentas.jsx
 * Tabla de historial de ventas con expansión por fila para ver ítems.
 */
import { useState } from 'react'
import { useVentas } from '@/hooks/useVentas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const BADGE = {
  efectivo:      { label: 'Efectivo',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  transferencia: { label: 'Transferencia', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  combinado:     { label: 'Combinado',     cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  fiado:         { label: 'Fiado',         cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
}

export default function TablaVentas({ periodo }) {
  const { ventas, cargando, error, recargar, cargarItems } = useVentas(periodo)
  const [expandida, setExpandida]   = useState(null)   // id de la venta expandida
  const [items,     setItems]       = useState({})     // { [ventaId]: [...items] }
  const [cargandoId, setCargandoId] = useState(null)

  async function toggleVenta(id) {
    if (expandida === id) { setExpandida(null); return }
    setExpandida(id)
    if (!items[id]) {
      setCargandoId(id)
      const data = await cargarItems(id)
      setItems(prev => ({ ...prev, [id]: data }))
      setCargandoId(null)
    }
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-5 py-4 text-sm text-red-400">
        Error al cargar ventas: {error}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* Encabezado */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="font-semibold text-white text-sm">Historial de ventas</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {cargando ? 'Cargando...' : `${ventas.length} venta${ventas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={recargar}
          className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700
                      text-gray-400 hover:text-white flex items-center justify-center
                      transition-all text-sm ${cargando ? 'animate-spin' : ''}`}
        >↻</button>
      </div>

      {/* Loading */}
      {cargando && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!cargando && ventas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <span className="text-4xl mb-3">🛒</span>
          <p className="text-sm font-medium">Sin ventas en este período</p>
          <p className="text-xs mt-1">Las ventas registradas aparecerán acá.</p>
        </div>
      )}

      {/* Tabla */}
      {!cargando && ventas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left w-8">#</th>
                <th className="px-5 py-3 text-left">Hora</th>
                <th className="px-5 py-3 text-left">Pago</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-2 py-3 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {ventas.map(v => {
                const badge = BADGE[v.tipo_pago] ?? BADGE.efectivo
                const hora  = (() => {
                  try { return format(new Date(v.vendido_en), 'HH:mm', { locale: es }) }
                  catch { return '—' }
                })()
                const isOpen = expandida === v.id

                return (
                  <>
                    {/* Fila principal */}
                    <tr
                      key={v.id}
                      onClick={() => toggleVenta(v.id)}
                      className={`cursor-pointer transition-colors ${
                        isOpen ? 'bg-sky-900/10' : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-gray-600">#{v.id}</td>
                      <td className="px-5 py-3 font-mono text-gray-300">{hora}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                          font-medium border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {v.cliente_nombre ?? <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-white">
                        ${v.total.toLocaleString('es-AR')}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={`text-gray-500 transition-transform inline-block ${
                          isOpen ? 'rotate-90' : ''
                        }`}>›</span>
                      </td>
                    </tr>

                    {/* Fila expandida con ítems */}
                    {isOpen && (
                      <tr key={`${v.id}-detail`} className="bg-gray-900/80">
                        <td colSpan={6} className="px-6 py-3">
                          {cargandoId === v.id ? (
                            <p className="text-xs text-gray-500 py-2">Cargando ítems...</p>
                          ) : (
                            <div className="space-y-1.5">
                              {(items[v.id] ?? []).map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-400 py-1
                                                        border-b border-gray-800/40 last:border-0">
                                  <span>
                                    <span className="text-gray-500 font-mono mr-2">{item.cantidad}x</span>
                                    {item.producto_nombre ?? 'Producto eliminado'}
                                  </span>
                                  <span className="font-mono text-gray-300">
                                    ${item.subtotal.toLocaleString('es-AR')}
                                  </span>
                                </div>
                              ))}

                              {/* Desglose de pago si es combinado */}
                              {v.tipo_pago === 'combinado' && (
                                <div className="mt-2 pt-2 border-t border-gray-800/60 flex gap-4 text-xs text-gray-500">
                                  <span>💵 Efectivo: ${v.monto_efectivo.toLocaleString('es-AR')}</span>
                                  <span>📱 Transf.: ${v.monto_transferencia.toLocaleString('es-AR')}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
