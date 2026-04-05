import { useState, useEffect } from 'react'
import BuscadorProducto from '@/components/pos/BuscadorProducto'
import Carrito from '@/components/pos/Carrito'
import ModalCobro from '@/components/pos/ModalCobro'
import ModalProductoNuevo from '@/components/pos/ModalProductoNuevo'
import PantallaCajaCerrada from '@/components/pos/PantallaCajaCerrada'
import { usePosStore, useTotalCarrito } from '@/store/posStore'
import { useCajaStore } from '@/store/cajaStore'

export default function POS() {
  const [modalCobro, setModalCobro]       = useState(false)
  const [productoNuevo, setProductoNuevo] = useState(null)
  const carrito        = usePosStore(s => s.carrito)
  const limpiarCarrito = usePosStore(s => s.limpiarCarrito)
  const total          = useTotalCarrito()
  const tieneItems     = carrito.length > 0

  const { estado, cargarCaja } = useCajaStore()

  // Verificar estado de caja al montar
  useEffect(() => { cargarCaja() }, [])

  // ── Cargando estado de caja ───────────────────────────────
  if (estado === 'cargando') {
    return (
      <div className="flex h-full bg-gray-950 items-center justify-center">
        <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Caja cerrada: mostrar pantalla de apertura ─────────────────
  if (estado === 'cerrada') {
    return <PantallaCajaCerrada />
  }

  // ── Caja abierta: POS normal ───────────────────────────────
  return (
    <div className="flex h-full bg-gray-950">

      {/* ══ PANEL IZQUIERDO — búsqueda ══ */}
      <div className="flex-1 flex flex-col p-5 gap-4 border-r border-gray-800 min-w-0">

        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Punto de venta</h1>
            <p className="text-xs text-gray-500 font-mono">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-mono">Caja abierta</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <BuscadorProducto onProductoNuevo={setProductoNuevo} />
        </div>
      </div>

      {/* ══ PANEL DERECHO — carrito ══ */}
      <div className="w-80 flex flex-col bg-gray-900 border-l border-gray-800">

        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🛒</span>
            <span className="font-semibold text-white text-sm">Carrito</span>
            {tieneItems && (
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-bold">
                {carrito.length}
              </span>
            )}
          </div>
          {tieneItems && (
            <button onClick={limpiarCarrito} className="text-xs text-gray-500 hover:text-red-400 transition-colors font-medium">
              Vaciar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden px-4 py-3 min-h-0 flex flex-col">
          <Carrito />
        </div>

        <div className="px-4 pb-5 pt-2 border-t border-gray-800 space-y-2 flex-shrink-0">
          <button
            disabled={!tieneItems}
            onClick={() => setModalCobro(true)}
            className="w-full py-4 rounded-xl font-bold text-base transition-all
                       bg-emerald-600 hover:bg-emerald-500 text-white
                       disabled:opacity-30 disabled:cursor-not-allowed
                       active:scale-95 shadow-lg shadow-emerald-900/30"
          >
            {tieneItems ? `Cobrar $${total.toLocaleString('es-AR')}` : 'Cobrar'}
          </button>

          {tieneItems && (
            <button
              onClick={() => setModalCobro(true)}
              className="w-full py-2.5 rounded-xl font-medium text-sm transition-all
                         bg-amber-600/20 hover:bg-amber-600/30 text-amber-400
                         border border-amber-600/20 hover:border-amber-600/40"
            >
              📝 Anotar como fiado
            </button>
          )}
        </div>
      </div>

      {modalCobro && (
        <ModalCobro onClose={() => setModalCobro(false)} onExito={() => setModalCobro(false)} />
      )}
      {productoNuevo && (
        <ModalProductoNuevo producto={productoNuevo} onClose={() => setProductoNuevo(null)} onGuardado={() => setProductoNuevo(null)} />
      )}
    </div>
  )
}
