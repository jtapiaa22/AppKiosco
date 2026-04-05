/**
 * Caja.jsx — Página de gestión de caja
 *
 * - Cerrada: botón simple de apertura
 * - Abierta:  tarjetas en tiempo real + historial de ventas + cierre
 */
import { useEffect, useState } from 'react'
import { useCajaStore } from '@/store/cajaStore'
import { useVentas } from '@/hooks/useVentas'
import toast from 'react-hot-toast'

const fmt = n => `$${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`

export default function Caja() {
  const { caja, estado, cargarCaja, abrirCaja, cerrarCaja, refrescarCaja } = useCajaStore()

  useEffect(() => { cargarCaja() }, [])

  // Auto-refresco cada 30 s cuando está abierta
  useEffect(() => {
    if (estado !== 'abierta') return
    const id = setInterval(refrescarCaja, 30_000)
    return () => clearInterval(id)
  }, [estado])

  if (estado === 'cargando') return <Spinner />
  if (estado === 'cerrada')  return <PanelCerrada abrirCaja={abrirCaja} />
  return <PanelAbierta caja={caja} cerrarCaja={cerrarCaja} refrescarCaja={refrescarCaja} />
}

// ──────────────────────────────────────────────────────────────────
function PanelCerrada({ abrirCaja }) {
  const [abriendo, setAbriendo] = useState(false)

  async function handleAbrir() {
    setAbriendo(true)
    const res = await abrirCaja()
    setAbriendo(false)
    if (res.ok) toast.success('\u00a1Caja abierta!')
    else toast.error('No se pudo abrir la caja')
  }

  return (
    <div className="flex h-full bg-gray-950 items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 w-full max-w-xs
                      shadow-2xl flex flex-col items-center gap-6 text-center">
        <div className="text-6xl">🔒</div>
        <div>
          <h2 className="text-xl font-bold text-white">Caja cerrada</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
        <button
          onClick={handleAbrir}
          disabled={abriendo}
          className="w-full py-4 rounded-xl font-bold text-base transition-all
                     bg-emerald-600 hover:bg-emerald-500 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
                     shadow-lg shadow-emerald-900/30"
        >
          {abriendo ? 'Abriendo...' : '🔓 Abrir caja'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
function PanelAbierta({ caja, cerrarCaja, refrescarCaja }) {
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando,    setCerrando]    = useState(false)
  const [resumen,     setResumen]     = useState(null)
  const [refrescando, setRefrescando] = useState(false)

  const { ventas, cargando: cargandoVentas, recargar: recargarVentas } = useVentas('hoy')

  async function handleRefrescar() {
    setRefrescando(true)
    await Promise.all([refrescarCaja(), recargarVentas()])
    setRefrescando(false)
  }

  async function handleCerrar() {
    setCerrando(true)
    const res = await cerrarCaja()
    setCerrando(false)
    if (res.ok) { setResumen(res.resumen); setConfirmando(false) }
    else toast.error('No se pudo cerrar la caja')
  }

  const totalCobrado = (caja.total_efectivo ?? 0) + (caja.total_transferencias ?? 0)

  const horaApertura = (() => {
    try { return new Date(caja.abierta_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }
    catch { return '--:--' }
  })()

  // ─ Pantalla resumen post-cierre ───────────────────────────────
  if (resumen) {
    const tot = (resumen.total_efectivo ?? 0) + (resumen.total_transferencias ?? 0)
    return (
      <div className="flex h-full bg-gray-950 items-center justify-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full
                        shadow-2xl flex flex-col gap-5">
          <div className="text-center">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-white">Caja cerrada</h2>
            <p className="text-xs text-gray-500 mt-1">
              Cerrada a las{' '}
              {new Date(resumen.cerrada_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
            <Fila label="💵 Efectivo"       valor={fmt(resumen.total_efectivo)} />
            <Fila label="📱 Transferencias" valor={fmt(resumen.total_transferencias)} />
            <Fila label="📝 Fiados"         valor={fmt(resumen.total_fiados)} />
            <Fila label="🛒 Ventas"         valor={resumen.cant_ventas} />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl
                          px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-400">Total cobrado</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{fmt(tot)}</span>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Podés abrir una nueva caja cuando quieras.
          </p>
        </div>
      </div>
    )
  }

  // ─ Modal confirmación cierre ───────────────────────────────
  if (confirmando) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 max-w-sm w-full mx-4
                        shadow-2xl flex flex-col gap-5">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-lg font-bold text-white">¿Cerrás la caja?</h2>
            <p className="text-sm text-gray-500 mt-1">Resumen del día:</p>
          </div>

          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
            <Fila label="💵 Efectivo"       valor={fmt(caja.total_efectivo)} />
            <Fila label="📱 Transferencias" valor={fmt(caja.total_transferencias)} />
            <Fila label="📝 Fiados"         valor={fmt(caja.total_fiados)} />
            <Fila label="🛒 Ventas"         valor={caja.cant_ventas} />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl
                          px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-400">Total cobrado</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{fmt(totalCobrado)}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setConfirmando(false)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-800
                         hover:bg-gray-700 text-white transition-colors">
              Cancelar
            </button>
            <button onClick={handleCerrar} disabled={cerrando}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-700
                         hover:bg-red-600 text-white transition-colors disabled:opacity-40">
              {cerrando ? 'Cerrando...' : 'Sí, cerrar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─ Vista principal ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800
                      flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">Caja</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs
                             font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Abierta
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Abierta a las {horaApertura}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefrescar}
            className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700
                        text-gray-400 hover:text-white flex items-center justify-center
                        text-sm transition-all ${refrescando ? 'animate-spin' : ''}`}
          >↻</button>
          <button
            onClick={() => setConfirmando(true)}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all
                       bg-red-700/80 hover:bg-red-600 text-white border border-red-700/60"
          >
            🔒 Cerrar caja
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Tarjetas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tarjeta emoji="💵" label="Efectivo"       valor={fmt(caja.total_efectivo)}       color="emerald" />
          <Tarjeta emoji="📱" label="Transferencias" valor={fmt(caja.total_transferencias)} color="sky"     />
          <Tarjeta emoji="📝" label="Fiados"         valor={fmt(caja.total_fiados)}         color="amber"   />
          <Tarjeta emoji="🛒" label="Ventas"         valor={caja.cant_ventas}              color="violet"  />
        </div>

        {/* Total general */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5
                        flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total cobrado</p>
          <p className="text-3xl font-bold font-mono text-white">{fmt(totalCobrado)}</p>
        </div>

        {/* Historial de ventas de esta caja */}
        <HistorialVentas ventas={ventas} cargando={cargandoVentas} />

      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
function HistorialVentas({ ventas, cargando }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h3 className="font-semibold text-white text-sm">Historial de ventas</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {cargando ? 'Cargando...' : `${ventas.length} venta${ventas.length !== 1 ? 's' : ''} hoy`}
        </p>
      </div>

      {cargando && (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!cargando && ventas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <span className="text-3xl mb-2">🛒</span>
          <p className="text-sm">Todavía no hay ventas en esta caja</p>
        </div>
      )}

      {!cargando && ventas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Hora</th>
                <th className="px-5 py-3 text-left">Tipo de pago</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {ventas.map(v => {
                const badgeCls = {
                  efectivo:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
                  transferencia: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
                  combinado:     'bg-violet-500/15 text-violet-400 border-violet-500/20',
                  fiado:         'bg-amber-500/15 text-amber-400 border-amber-500/20',
                }[v.tipo_pago] ?? 'bg-gray-700 text-gray-400 border-gray-600'

                const hora = (() => {
                  try {
                    return new Date(v.vendido_en).toLocaleTimeString('es-AR', {
                      hour: '2-digit', minute: '2-digit'
                    })
                  } catch { return '--' }
                })()

                return (
                  <tr key={v.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">#{v.id}</td>
                    <td className="px-5 py-3 font-mono text-gray-300">{hora}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                       text-xs font-medium border ${badgeCls}`}>
                        {v.tipo_pago}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {v.cliente_nombre ?? <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-white">
                      {fmt(v.total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes pequeños ───────────────────────────────────────
function Tarjeta({ emoji, label, valor, color }) {
  const ring = { emerald: 'border-emerald-500/20 bg-emerald-500/5', sky: 'border-sky-500/20 bg-sky-500/5', amber: 'border-amber-500/20 bg-amber-500/5', violet: 'border-violet-500/20 bg-violet-500/5' }
  const txt  = { emerald: 'text-emerald-400', sky: 'text-sky-400', amber: 'text-amber-400', violet: 'text-violet-400' }
  return (
    <div className={`rounded-2xl border px-5 py-4 ${ring[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${txt[color]}`}>{valor}</p>
    </div>
  )
}

function Fila({ label, valor }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-mono text-sm text-white font-semibold">{valor}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex h-full bg-gray-950 items-center justify-center">
      <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
