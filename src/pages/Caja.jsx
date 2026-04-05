/**
 * Caja.jsx
 * - Cerrada: botón abrir + historial de cajas agrupado por DÍA
 *     → cada día muestra sus sesiones (cajas) y el total acumulado del día
 * - Abierta: tarjetas en tiempo real + historial de ventas del día + cierre
 */
import { useEffect, useState, useCallback } from 'react'
import { useCajaStore } from '@/store/cajaStore'
import { useVentas } from '@/hooks/useVentas'
import { dbQuery } from '@/services/database'
import toast from 'react-hot-toast'

const fmt      = n => `$${(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
const fmtHora  = s => { try { return new Date(s).toLocaleTimeString('es-AR',  { hour: '2-digit', minute: '2-digit' }) } catch { return '--:--' } }
const fmtFecha = s => {
  try {
    // s puede ser 'YYYY-MM-DD' — parseamos con mediodía para evitar desfase UTC
    const d = new Date(s + 'T12:00:00')
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return s }
}

/**
 * Agrupa un array de cajas por su campo `fecha` (YYYY-MM-DD).
 * Retorna un array de objetos: { fecha, cajas[], totales }
 * ordenado del más reciente al más antiguo.
 */
function agruparPorDia(cajas) {
  const mapa = {}
  for (const c of cajas) {
    const key = c.fecha
    if (!mapa[key]) mapa[key] = []
    mapa[key].push(c)
  }
  return Object.entries(mapa)
    .sort(([a], [b]) => b.localeCompare(a))   // desc por fecha string YYYY-MM-DD
    .map(([fecha, sesiones]) => {
      const totales = sesiones.reduce(
        (acc, s) => ({
          efectivo:       acc.efectivo       + (s.total_efectivo       ?? 0),
          transferencias: acc.transferencias + (s.total_transferencias ?? 0),
          fiados:         acc.fiados         + (s.total_fiados         ?? 0),
          ventas:         acc.ventas         + (s.cant_ventas          ?? 0),
        }),
        { efectivo: 0, transferencias: 0, fiados: 0, ventas: 0 }
      )
      // cobradoReal = efectivo + transferencias (excluye fiados, que todavía no ingresaron)
      totales.cobradoReal = totales.efectivo + totales.transferencias
      return { fecha, sesiones, totales }
    })
}

export default function Caja() {
  const { caja, estado, cargarCaja, abrirCaja, cerrarCaja, refrescarCaja } = useCajaStore()

  useEffect(() => { cargarCaja() }, [])

  useEffect(() => {
    if (estado !== 'abierta') return
    const id = setInterval(refrescarCaja, 30_000)
    return () => clearInterval(id)
  }, [estado])

  if (estado === 'cargando') return <Spinner />
  if (estado === 'cerrada')  return <PanelCerrada abrirCaja={abrirCaja} />
  return <PanelAbierta caja={caja} cerrarCaja={cerrarCaja} refrescarCaja={refrescarCaja} />
}

// ══════════════════════════════════════════════════════════════════
//  PANEL CERRADA
// ══════════════════════════════════════════════════════════════════
function PanelCerrada({ abrirCaja }) {
  const [abriendo,      setAbriendo]      = useState(false)
  const [dias,          setDias]          = useState([])     // días agrupados
  const [cargandoHist,  setCargandoHist]  = useState(true)
  const [diaExpandido,  setDiaExpandido]  = useState(null)   // 'YYYY-MM-DD'
  const [sesExpandida,  setSesExpandida]  = useState(null)   // cajaId de sesión expandida
  const [ventasCaja,    setVentasCaja]    = useState({})     // { [cajaId]: ventas[] }
  const [cargandoCajaId, setCargandoCajaId] = useState(null)

  useEffect(() => {
    async function cargar() {
      setCargandoHist(true)
      try {
        const rows = await dbQuery(
          `SELECT * FROM cajas WHERE estado = 'cerrada' ORDER BY id DESC LIMIT 200`
        )
        setDias(agruparPorDia(rows))
      } catch {}
      setCargandoHist(false)
    }
    cargar()
  }, [])

  async function handleAbrir() {
    setAbriendo(true)
    const res = await abrirCaja()
    setAbriendo(false)
    if (res.ok) toast.success('¡Caja abierta!')
    else toast.error('No se pudo abrir la caja')
  }

  function toggleDia(fecha) {
    setDiaExpandido(prev => prev === fecha ? null : fecha)
    setSesExpandida(null)   // colapsar sesión al cambiar de día
  }

  async function toggleSesion(cajaId) {
    if (sesExpandida === cajaId) { setSesExpandida(null); return }
    setSesExpandida(cajaId)
    if (!ventasCaja[cajaId]) {
      setCargandoCajaId(cajaId)
      try {
        const rows = await dbQuery(
          `SELECT v.*, c.nombre AS cliente_nombre
           FROM ventas v
           LEFT JOIN clientes c ON c.id = v.cliente_id
           WHERE v.vendido_en >= (SELECT abierta_en FROM cajas WHERE id = ?)
             AND (  (SELECT cerrada_en FROM cajas WHERE id = ?) IS NULL
                 OR v.vendido_en <= (SELECT cerrada_en FROM cajas WHERE id = ?))
           ORDER BY v.vendido_en ASC`,
          [cajaId, cajaId, cajaId]
        )
        setVentasCaja(prev => ({ ...prev, [cajaId]: rows }))
      } catch { setVentasCaja(prev => ({ ...prev, [cajaId]: [] })) }
      setCargandoCajaId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-white">Caja</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* Botón abrir */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">🔒</div>
          <div>
            <h2 className="text-lg font-bold text-white">Caja cerrada</h2>
            <p className="text-sm text-gray-500 mt-1">Abrila para empezar a registrar ventas</p>
          </div>
          <button
            onClick={handleAbrir}
            disabled={abriendo}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all
                       bg-emerald-600 hover:bg-emerald-500 text-white
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
                       shadow-lg shadow-emerald-900/30"
          >
            {abriendo ? 'Abriendo...' : '🔓 Abrir caja'}
          </button>
        </div>

        {/* Historial agrupado por día */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-white text-sm">📂 Historial de cajas</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {cargandoHist ? 'Cargando...' : `${dias.length} día${dias.length !== 1 ? 's' : ''} registrado${dias.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {cargandoHist && (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!cargandoHist && dias.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <span className="text-3xl mb-2">📂</span>
              <p className="text-sm">Todavía no hay cajas registradas</p>
            </div>
          )}

          {!cargandoHist && dias.length > 0 && (
            <div className="divide-y divide-gray-800/60">
              {dias.map(({ fecha, sesiones, totales }) => {
                const isDiaOpen = diaExpandido === fecha

                return (
                  <div key={fecha}>

                    {/* ── Fila de DÍA ── */}
                    <button
                      onClick={() => toggleDia(fecha)}
                      className={`w-full px-5 py-4 flex items-center gap-4 text-left transition-colors
                                  ${ isDiaOpen ? 'bg-sky-900/10' : 'hover:bg-gray-800/30' }`}
                    >
                      {/* Ícono + fecha */}
                      <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center
                                      text-lg flex-shrink-0">
                        📅
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white capitalize">
                          {fmtFecha(fecha)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''}
                          {' · '}
                          {totales.ventas} venta{totales.ventas !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Total cobrado del día (sin fiados) */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold text-emerald-400">{fmt(totales.cobradoReal)}</p>
                        <p className="text-xs text-gray-600 mt-0.5">cobrado</p>
                      </div>

                      <span className={`text-gray-500 text-lg transition-transform duration-200
                                        ${ isDiaOpen ? 'rotate-90' : '' }`}>›</span>
                    </button>

                    {/* ── Contenido del DÍA expandido ── */}
                    {isDiaOpen && (
                      <div className="bg-gray-950/50 border-t border-gray-800/50">

                        {/* Tarjetas resumen del día — 5 tarjetas en 2 filas */}
                        <div className="px-5 pt-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <MiniTarjeta label="💵 Efectivo"       valor={fmt(totales.efectivo)}       color="emerald" />
                          <MiniTarjeta label="📱 Transferencias" valor={fmt(totales.transferencias)} color="sky"     />
                          <MiniTarjeta label="📝 Fiados"         valor={fmt(totales.fiados)}         color="amber"   />
                          <MiniTarjeta label="🛒 Ventas"         valor={totales.ventas}              color="violet"  />
                          {/* Total cobrado real del día: efectivo + transferencias, SIN fiados */}
                          <MiniTarjeta
                            label="💰 Cobrado (sin fiados)"
                            valor={fmt(totales.cobradoReal)}
                            color="emerald"
                            destacado
                          />
                        </div>

                        {/* Separador + label sesiones */}
                        {sesiones.length > 1 && (
                          <div className="px-5 pb-2">
                            <p className="text-xs text-gray-600 uppercase tracking-wider">
                              Sesiones de caja
                            </p>
                          </div>
                        )}

                        {/* ── Sesiones del día ── */}
                        <div className="divide-y divide-gray-800/40 pb-2">
                          {sesiones.map((ses, idx) => {
                            const isSesOpen    = sesExpandida === ses.id
                            const sesCobrado   = (ses.total_efectivo ?? 0) + (ses.total_transferencias ?? 0)
                            const ventasSes    = ventasCaja[ses.id] ?? []

                            return (
                              <div key={ses.id}>

                                {/* Fila sesión */}
                                <button
                                  onClick={() => toggleSesion(ses.id)}
                                  className={`w-full px-6 py-3 flex items-center gap-3 text-left
                                              transition-colors
                                              ${ isSesOpen ? 'bg-gray-800/60' : 'hover:bg-gray-800/20' }`}
                                >
                                  {/* Número sesión */}
                                  <span className="w-6 h-6 rounded-lg bg-gray-700 text-gray-400
                                                   text-xs font-bold flex items-center justify-center
                                                   flex-shrink-0">
                                    {idx + 1}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-300">
                                      {ses.abierta_en ? fmtHora(ses.abierta_en) : '?'}
                                      <span className="text-gray-600 mx-1">→</span>
                                      {ses.cerrada_en ? fmtHora(ses.cerrada_en) : <span className="text-amber-400">abierta</span>}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {ses.cant_ventas ?? 0} venta{(ses.cant_ventas ?? 0) !== 1 ? 's' : ''}
                                    </p>
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <p className="font-mono text-sm font-semibold text-white">{fmt(sesCobrado)}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">sin fiados</p>
                                  </div>

                                  <span className={`text-gray-600 text-sm transition-transform duration-200
                                                    ${ isSesOpen ? 'rotate-90' : '' }`}>›</span>
                                </button>

                                {/* Detalle expandido de la sesión */}
                                {isSesOpen && (
                                  <div className="px-6 pb-4 pt-2 space-y-3">

                                    {/* Mini-resumen de la sesión */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <MiniTarjeta label="💵 Efectivo"       valor={fmt(ses.total_efectivo)}       color="emerald" />
                                      <MiniTarjeta label="📱 Transf."        valor={fmt(ses.total_transferencias)} color="sky"     />
                                      <MiniTarjeta label="📝 Fiados"         valor={fmt(ses.total_fiados)}         color="amber"   />
                                      <MiniTarjeta
                                        label="💰 Cobrado"
                                        valor={fmt(sesCobrado)}
                                        color="emerald"
                                        destacado
                                      />
                                    </div>

                                    {/* Ventas de la sesión */}
                                    {cargandoCajaId === ses.id ? (
                                      <div className="flex items-center gap-2 py-3 text-xs text-gray-500">
                                        <div className="w-3 h-3 border border-sky-500 border-t-transparent rounded-full animate-spin" />
                                        Cargando ventas...
                                      </div>
                                    ) : ventasSes.length === 0 ? (
                                      <p className="text-xs text-gray-600 py-2">Sin ventas en esta sesión</p>
                                    ) : (
                                      <TablaMiniVentas ventas={ventasSes} />
                                    )}
                                  </div>
                                )}

                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  TABLA MINI (ventas dentro de una sesión en el historial)
// ══════════════════════════════════════════════════════════════════
function TablaMiniVentas({ ventas }) {
  const BADGE = {
    efectivo:      'bg-emerald-500/15 text-emerald-400',
    transferencia: 'bg-sky-500/15 text-sky-400',
    combinado:     'bg-violet-500/15 text-violet-400',
    fiado:         'bg-amber-500/15 text-amber-400',
  }
  return (
    <div className="rounded-xl overflow-hidden border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-800/50 text-gray-500 uppercase tracking-wider">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Hora</th>
            <th className="px-3 py-2 text-left">Pago</th>
            <th className="px-3 py-2 text-left">Cliente</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {ventas.map(v => (
            <tr key={v.id} className="hover:bg-gray-800/30 transition-colors">
              <td className="px-3 py-2 font-mono text-gray-600">#{v.id}</td>
              <td className="px-3 py-2 font-mono text-gray-400">
                {(() => { try { return new Date(v.vendido_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) } catch { return '--:--' } })()}
              </td>
              <td className="px-3 py-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ BADGE[v.tipo_pago] ?? 'bg-gray-700 text-gray-400' }`}>
                  {v.tipo_pago}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-500">
                {v.cliente_nombre ?? <span className="text-gray-700">—</span>}
              </td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-white">
                {fmt(v.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PANEL ABIERTA
// ══════════════════════════════════════════════════════════════════
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
  const horaApertura = fmtHora(caja.abierta_en)

  // ─ Resumen post-cierre ────────────────────────────────────────
  if (resumen) {
    const tot = (resumen.total_efectivo ?? 0) + (resumen.total_transferencias ?? 0)
    return (
      <div className="flex h-full bg-gray-950 items-center justify-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full
                        shadow-2xl flex flex-col gap-5">
          <div className="text-center">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-white">Caja cerrada</h2>
            <p className="text-xs text-gray-500 mt-1">Cerrada a las {fmtHora(resumen.cerrada_en)}</p>
          </div>
          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
            <Fila label="💵 Efectivo"       valor={fmt(resumen.total_efectivo)} />
            <Fila label="📱 Transferencias" valor={fmt(resumen.total_transferencias)} />
            <Fila label="📝 Fiados"         valor={fmt(resumen.total_fiados)} />
            <Fila label="🛒 Ventas"         valor={resumen.cant_ventas} />
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl
                          px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-400">💰 Cobrado en la sesión</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{fmt(tot)}</span>
          </div>
          <p className="text-xs text-gray-600 text-center">Podés abrir una nueva caja cuando quieras.</p>
        </div>
      </div>
    )
  }

  // ─ Modal confirmación ─────────────────────────────────────────
  if (confirmando) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 max-w-sm w-full mx-4
                        shadow-2xl flex flex-col gap-5">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-lg font-bold text-white">¿Cerrás la caja?</h2>
            <p className="text-sm text-gray-500 mt-1">Resumen de esta sesión:</p>
          </div>
          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
            <Fila label="💵 Efectivo"       valor={fmt(caja.total_efectivo)} />
            <Fila label="📱 Transferencias" valor={fmt(caja.total_transferencias)} />
            <Fila label="📝 Fiados"         valor={fmt(caja.total_fiados)} />
            <Fila label="🛒 Ventas"         valor={caja.cant_ventas} />
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl
                          px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-400">💰 Cobrado (sin fiados)</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{fmt(totalCobrado)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setConfirmando(false)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-800
                         hover:bg-gray-700 text-white transition-colors">Cancelar</button>
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

  // ─ Vista principal ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">
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
          <button onClick={handleRefrescar}
            className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700
                        text-gray-400 hover:text-white flex items-center justify-center
                        text-sm transition-all ${refrescando ? 'animate-spin' : ''}`}>↻</button>
          <button onClick={() => setConfirmando(true)}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all
                       bg-red-700/80 hover:bg-red-600 text-white border border-red-700/60">
            🔒 Cerrar caja
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tarjeta emoji="💵" label="Efectivo"       valor={fmt(caja.total_efectivo)}       color="emerald" />
          <Tarjeta emoji="📱" label="Transferencias" valor={fmt(caja.total_transferencias)} color="sky"     />
          <Tarjeta emoji="📝" label="Fiados"         valor={fmt(caja.total_fiados)}         color="amber"   />
          <Tarjeta emoji="🛒" label="Ventas"         valor={caja.cant_ventas}               color="violet"  />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5
                        flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wider">💰 Cobrado esta sesión (sin fiados)</p>
          <p className="text-3xl font-bold font-mono text-white">{fmt(totalCobrado)}</p>
        </div>
        <HistorialVentas ventas={ventas} cargando={cargandoVentas} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  COMPONENTES SHARED
// ══════════════════════════════════════════════════════════════════
function HistorialVentas({ ventas, cargando }) {
  const BADGE = {
    efectivo:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    transferencia: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    combinado:     'bg-violet-500/15 text-violet-400 border-violet-500/20',
    fiado:         'bg-amber-500/15 text-amber-400 border-amber-500/20',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h3 className="font-semibold text-white text-sm">Ventas de esta sesión</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {cargando ? 'Cargando...' : `${ventas.length} venta${ventas.length !== 1 ? 's' : ''}`}
        </p>
      </div>
      {cargando && <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>}
      {!cargando && ventas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <span className="text-3xl mb-2">🛒</span>
          <p className="text-sm">Todavía no hay ventas</p>
        </div>
      )}
      {!cargando && ventas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Hora</th>
                <th className="px-5 py-3 text-left">Pago</th>
                <th className="px-5 py-3 text-left">Cliente</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {ventas.map(v => (
                <tr key={v.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">#{v.id}</td>
                  <td className="px-5 py-3 font-mono text-gray-300">
                    {(() => { try { return new Date(v.vendido_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) } catch { return '--:--' } })()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                     text-xs font-medium border ${BADGE[v.tipo_pago] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {v.tipo_pago}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {v.cliente_nombre ?? <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-white">{fmt(v.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

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

/**
 * MiniTarjeta — resumen compacto dentro del historial.
 * `destacado` aplica un borde más pronunciado para distinguir el total cobrado real.
 */
function MiniTarjeta({ label, valor, color, destacado = false }) {
  const cls = {
    emerald: destacado
      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/40'
      : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/15',
    sky:    'text-sky-400 bg-sky-500/5 border-sky-500/15',
    amber:  'text-amber-400 bg-amber-500/5 border-amber-500/15',
    violet: 'text-violet-400 bg-violet-500/5 border-violet-500/15',
  }
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${cls[color]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-mono font-bold text-sm ${destacado ? 'text-base' : ''}`}>{valor}</p>
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
