/**
 * TablaVentas.jsx
 *
 * - Buscador de fecha (input date) que filtra ventas de un día exacto
 * - Click en fila abre modal con detalle completo:
 *     fecha+hora, método de pago, transferente, desglose, productos, cliente
 */
import { useState } from 'react'
import { useVentas } from '@/hooks/useVentas'

const BADGE = {
  efectivo:      { label: 'Efectivo',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  transferencia: { label: 'Transferencia', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  combinado:     { label: 'Combinado',     cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  fiado:         { label: 'Fiado',         cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
}

const fmt     = n  => `$${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
const fmtHora = s  => { try { return new Date(s).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) } catch { return '—' } }
const fmtFechaHora = s => {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
         + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  } catch { return s }
}

export default function TablaVentas({ periodo }) {
  const [fechaBuscada, setFechaBuscada] = useState('')   // 'YYYY-MM-DD' o ''
  const periodoEfectivo = fechaBuscada ? `fecha:${fechaBuscada}` : periodo

  const { ventas, cargando, error, recargar, cargarItems } = useVentas(periodoEfectivo)
  const [ventaModal, setVentaModal] = useState(null)     // venta seleccionada para el modal
  const [items,      setItems]      = useState({})       // cache de items por venta_id
  const [cargandoId, setCargandoId] = useState(null)

  async function abrirModal(venta) {
    setVentaModal(venta)
    if (!items[venta.id]) {
      setCargandoId(venta.id)
      const data = await cargarItems(venta.id)
      setItems(prev => ({ ...prev, [venta.id]: data }))
      setCargandoId(null)
    }
  }

  if (error) return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-5 py-4 text-sm text-red-400">
      Error al cargar ventas: {error}
    </div>
  )

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Header + buscador */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-800 flex-wrap">
          <div>
            <h3 className="font-semibold text-white text-sm">Historial de ventas</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {cargando
                ? 'Cargando...'
                : `${ventas.length} venta${ventas.length !== 1 ? 's' : ''}${
                    fechaBuscada
                      ? ` del ${new Date(fechaBuscada + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`
                      : ''
                  }`
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Buscador de fecha */}
            <div className="relative">
              <input
                type="date"
                value={fechaBuscada}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setFechaBuscada(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs
                           text-white focus:outline-none focus:ring-2 focus:ring-sky-500
                           [color-scheme:dark] cursor-pointer"
              />
            </div>
            {fechaBuscada && (
              <button
                onClick={() => setFechaBuscada('')}
                className="px-2.5 py-1.5 rounded-xl bg-gray-800 border border-gray-700
                           text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                × Limpiar
              </button>
            )}
            <button onClick={recargar}
              className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700
                          text-gray-400 hover:text-white flex items-center justify-center
                          transition-all text-sm ${cargando ? 'animate-spin' : ''}`}>↻</button>
          </div>
        </div>

        {cargando && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && ventas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <span className="text-4xl mb-3">🛒</span>
            <p className="text-sm font-medium">
              {fechaBuscada ? 'Sin ventas ese día' : 'Sin ventas en este período'}
            </p>
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
                  const badge    = BADGE[v.tipo_pago] ?? BADGE.efectivo
                  const hora     = fmtHora(v.vendido_en)
                  const identidad = v.cliente_nombre
                    ? v.cliente_nombre
                    : (v.tipo_pago === 'transferencia' || v.tipo_pago === 'combinado') && v.transferente
                      ? v.transferente
                      : null

                  return (
                    <tr
                      key={v.id}
                      onClick={() => abrirModal(v)}
                      className="cursor-pointer hover:bg-gray-800/50 transition-colors"
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
                        <span className="text-gray-500 text-xs">›</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detalle venta */}
      {ventaModal && (
        <ModalDetalleVenta
          venta={ventaModal}
          items={items[ventaModal.id] ?? []}
          cargando={cargandoId === ventaModal.id}
          onClose={() => setVentaModal(null)}
          fmtFechaHora={fmtFechaHora}
        />
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════════
function ModalDetalleVenta({ venta: v, items, cargando, onClose, fmtFechaHora }) {
  const BADGE = {
    efectivo:      { label: 'Efectivo',      icon: '💵', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    transferencia: { label: 'Transferencia', icon: '📱', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
    combinado:     { label: 'Combinado',     icon: '💳', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
    fiado:         { label: 'Fiado',         icon: '📝', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  }
  const fmt = n => `$${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const badge = BADGE[v.tipo_pago] ?? BADGE.efectivo

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header modal */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-600">Venta #{v.id}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                               text-xs font-medium border ${badge.cls}`}>
                {badge.icon} {badge.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{fmtFechaHora(v.vendido_en)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400
                       hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">

          {/* Total + desglose */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3
                          flex justify-between items-center">
            <span className="text-sm text-gray-400">Total</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{fmt(v.total)}</span>
          </div>

          {/* Desglose por método */}
          {v.tipo_pago === 'efectivo' && (
            <Chip icon="💵" label="Pagado en efectivo" value={fmt(v.total)} color="emerald" />
          )}
          {v.tipo_pago === 'transferencia' && (
            <div className="space-y-2">
              <Chip icon="📱" label="Transferencia" value={fmt(v.monto_transferencia ?? v.total)} color="sky" />
              {v.transferente && (
                <Chip icon="👤" label="Transfirió" value={v.transferente} color="sky" />
              )}
            </div>
          )}
          {v.tipo_pago === 'combinado' && (
            <div className="space-y-2">
              <Chip icon="💵" label="Efectivo"      value={fmt(v.monto_efectivo)}      color="emerald" />
              <Chip icon="📱" label="Transferencia" value={fmt(v.monto_transferencia)} color="sky" />
              {v.transferente && (
                <Chip icon="👤" label="Transfirió" value={v.transferente} color="sky" />
              )}
            </div>
          )}
          {v.tipo_pago === 'fiado' && v.cliente_nombre && (
            <Chip icon="📝" label="Fiado a" value={v.cliente_nombre} color="amber" />
          )}
          {v.cliente_nombre && v.tipo_pago !== 'fiado' && (
            <Chip icon="👤" label="Cliente" value={v.cliente_nombre} color="violet" />
          )}

          {/* Productos */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700/50">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                🛒 Productos
              </span>
            </div>
            {cargando ? (
              <div className="flex items-center gap-2 px-3 py-3">
                <div className="w-3 h-3 border border-sky-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Cargando...</span>
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-600">Sin ítems registrados</p>
            ) : (
              <div className="divide-y divide-gray-700/40">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                        {item.cantidad}×
                      </span>
                      <span className="text-xs text-gray-300">
                        {item.producto_nombre ?? 'Producto eliminado'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-gray-300">{fmt(item.subtotal)}</span>
                      {item.cantidad > 1 && (
                        <p className="text-xs text-gray-600">{fmt(item.precio_unitario)} c/u</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gray-800
                       hover:bg-gray-700 text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function Chip({ icon, label, value, color }) {
  const cls = {
    sky:     'bg-sky-500/10 border-sky-500/20 text-sky-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    violet:  'bg-violet-500/10 border-violet-500/20 text-violet-300',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-300',
    gray:    'bg-gray-700/50 border-gray-600/40 text-gray-300',
  }[color] ?? 'bg-gray-700/50 border-gray-600 text-gray-300'

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cls}`}>
      <span className="flex items-center gap-2 text-xs text-gray-400">
        <span>{icon}</span> {label}
      </span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  )
}