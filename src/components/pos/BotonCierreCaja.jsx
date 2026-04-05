/**
 * BotonCierreCaja.jsx
 * Botón en el sidebar del POS para cerrar la caja.
 * Muestra un modal de confirmación con el resumen antes de cerrar.
 */
import { useState } from 'react'
import { useCajaStore } from '@/store/cajaStore'
import toast from 'react-hot-toast'

export default function BotonCierreCaja() {
  const { caja, cerrarCaja, estado } = useCajaStore()
  const [confirmando, setConfirmando] = useState(false)
  const [cerrando, setCerrando]       = useState(false)
  const [resumen, setResumen]         = useState(null)

  if (estado !== 'abierta' || !caja) return null

  async function handleCerrar() {
    setCerrando(true)
    const res = await cerrarCaja()
    setCerrando(false)
    if (res.ok) {
      setResumen(res.resumen)
      setConfirmando(false)
    } else {
      toast.error('No se pudo cerrar la caja')
    }
  }

  // Modal resumen post-cierre
  if (resumen) {
    const totalGeneral = (resumen.total_efectivo ?? 0) + (resumen.total_transferencias ?? 0)
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-5">
          <div className="text-center">
            <div className="text-5xl mb-2">🔒</div>
            <h2 className="text-xl font-bold text-white">Caja cerrada</h2>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(resumen.cerrada_en).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Resumen */}
          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700 overflow-hidden">
            <Fila label="💵 Efectivo"       valor={resumen.total_efectivo}       />
            <Fila label="📱 Transferencias" valor={resumen.total_transferencias} />
            <Fila label="📝 Fiados"         valor={resumen.total_fiados}         />
            <Fila label="🛒 Ventas"         valor={resumen.cant_ventas} esNumero />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-400">Total cobrado</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ${totalGeneral.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            onClick={() => setResumen(null)}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700
                       text-white transition-colors"
          >
            Cerrar resumen
          </button>
        </div>
      </div>
    )
  }

  // Modal confirmación
  if (confirmando) {
    const totalGeneral = (caja.total_efectivo ?? 0) + (caja.total_transferencias ?? 0)
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-5">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-lg font-bold text-white">¿Cerrar la caja?</h2>
            <p className="text-sm text-gray-500 mt-1">Resumen del día hasta ahora:</p>
          </div>

          <div className="bg-gray-800 rounded-xl divide-y divide-gray-700 overflow-hidden">
            <Fila label="💵 Efectivo"       valor={caja.total_efectivo}       />
            <Fila label="📱 Transferencias" valor={caja.total_transferencias} />
            <Fila label="📝 Fiados"         valor={caja.total_fiados}         />
            <Fila label="🛒 Ventas"         valor={caja.cant_ventas} esNumero />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-400">Total cobrado</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ${totalGeneral.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmando(false)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700
                         text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCerrar}
              disabled={cerrando}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-700 hover:bg-red-600
                         text-white transition-colors disabled:opacity-40"
            >
              {cerrando ? 'Cerrando...' : 'Sí, cerrar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Botón en el sidebar
  return (
    <button
      onClick={() => setConfirmando(true)}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all w-full text-red-400 hover:bg-red-900/20 hover:text-red-300"
    >
      <span className="text-base">🔒</span>
      Cerrar caja
    </button>
  )
}

function Fila({ label, valor, esNumero }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="font-mono text-sm text-white font-semibold">
        {esNumero ? valor : `$${(valor ?? 0).toLocaleString('es-AR')}`}
      </span>
    </div>
  )
}
