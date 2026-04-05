/**
 * TablaVentas.jsx
 * Historial de ventas con fila expandible que muestra:
 * - Ítems comprados
 * - Quién transfirió (si aplica)
 * - Desglose efectivo/transferencia en pagos combinados
 * - Nota de la venta si existe
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

const fmt = n => `$${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

export default function TablaVentas({ periodo }) {
  const { ventas, cargando, error, recargar, cargarItems } = useVentas(periodo)
  const [expandida,  setExpandida]  = useState(null)
  const [items,      setItems]      = useState({})
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

  if (error) return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-5 py-4 text-sm text-red-400">
      Error al cargar ventas: {error}
    </div>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="font-semibold text-white text-sm">Historial de ventas</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {cargando ? 'Cargando...' : `${ventas.length} venta${ventas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={recargar}
          className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700
                      text-gray-400 hover:text-white flex items-center justify-center
                      transition-all text-sm ${cargando ? 'animate-spin' : ''}`}>↻</button>
      </div>

      {cargando && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!cargando && ventas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <span className="text-4xl mb-3">🛒</span>
          <p className="text-sm font-medium">Sin ventas en este período</p>
          <p className="text-xs mt-1">Las ventas registradas aparecerán acá.</p>
        </div>
      )}

      {!cargando && ventas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Hora</th>
                <th className="px-4 py-3 text-left">Pago</th>
                <th className="px-4 py-3 text-left">Cliente / Transferente</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-2 py-3 text-center w-8"></th>
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

                const identidad = v.cliente_nombre
                  ? v.cliente_nombre
                  : (v.tipo_pago === 'transferencia' || v.tipo_pago === 'combinado') && v.transferente
                    ? v.transferente
                    : null

                return (
                  <>
                    <tr
                      key={v.id}
                      onClick={() => toggleVenta(v.id)}
                      className={`cursor-pointer transition-colors ${
                        isOpen ? 'bg-sky-900/10' : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">#{v.id}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">{hora}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                         text-xs font-medium border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {identidad
                          ? <span className="text-gray-300">{identidad}</span>
                          : <span className="text-gray-700">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                        {fmt(v.total)}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={`text-gray-500 transition-transform inline-block ${
                          isOpen ? 'rotate-90' : ''
                        }`}>›</span>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr key={`${v.id}-detail`} className="bg-gray-900/80">
                        <td colSpan={6} className="px-5 py-4">
                          {cargandoId === v.id
                            ? <p className="text-xs text-gray-500">Cargando...</p>
                            : <DetalleVenta venta={v} items={items[v.id] ?? []} />
                          }
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

function DetalleVenta({ venta: v, items }) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-700/50">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</span>
        </div>
        {items.length === 0
          ? <p className="px-3 py-3 text-xs text-gray-600">Sin ítems registrados</p>
          : <div className="divide-y divide-gray-700/40">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                      {item.cantidad}×
                    </span>
                    <span className="text-xs text-gray-300">
                      {item.producto_nombre ?? 'Producto eliminado'}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-gray-300">{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>
        }
      </div>

      <div className="flex flex-wrap gap-3">
        {(v.tipo_pago === 'transferencia' || v.tipo_pago === 'combinado') && v.transferente && (
          <InfoChip icon="📱" label="Transfirió" value={v.transferente} color="sky" />
        )}
        {v.tipo_pago === 'combinado' && (
          <>
            <InfoChip icon="💵" label="Efectivo"       value={fmt(v.monto_efectivo)}       color="emerald" />
            <InfoChip icon="📱" label="Transferencia"  value={fmt(v.monto_transferencia)}  color="sky"     />
          </>
        )}
        {v.nota          && <InfoChip icon="📝" label="Nota"    value={v.nota}            color="gray"   />}
        {v.cliente_nombre && <InfoChip icon="👤" label="Cliente" value={v.cliente_nombre} color="violet" />}
      </div>
    </div>
  )
}

function InfoChip({ icon, label, value, color }) {
  const cls = {
    sky:     'bg-sky-500/10 border-sky-500/20 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    violet:  'bg-violet-500/10 border-violet-500/20 text-violet-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
    gray:    'bg-gray-700/50 border-gray-600/40 text-gray-400',
  }[color] ?? 'bg-gray-700/50 border-gray-600 text-gray-400'

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${cls}`}>
      <span>{icon}</span>
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
