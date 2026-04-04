import { useState } from 'react'
import { useStock } from '@/hooks/useStock'
import FilaProducto from '@/components/stock/FilaProducto'
import ModalProducto from '@/components/stock/ModalProducto'
import ModalAjusteStock from '@/components/stock/ModalAjusteStock'

export default function Stock() {
  const {
    productos, cargando,
    filtro, setFiltro,
    soloStockBajo, setSoloStockBajo,
    guardarProducto, eliminarProducto, ajustarStock,
  } = useStock()

  const [modalProducto, setModalProducto]     = useState(null)
  const [modalAjuste, setModalAjuste]         = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)

  const stocksBajos = productos.filter(p => p.stock_actual <= p.stock_minimo).length

  async function handleEliminar(id) {
    await eliminarProducto(id)
    setConfirmEliminar(null)
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">

      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">Stock</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {productos.length} productos
            {stocksBajos > 0 && <span className="ml-2 text-amber-400">· {stocksBajos} con stock bajo</span>}
          </p>
        </div>
        <button onClick={() => setModalProducto({})}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500
                     text-white text-sm font-medium transition-colors">
          <span className="text-base leading-none">+</span> Nuevo producto
        </button>
      </div>

      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input value={filtro} onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar por nombre, código o categoría..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2
                       text-sm text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <button onClick={() => setSoloStockBajo(!soloStockBajo)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all
            ${soloStockBajo
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
          ⚠ Stock bajo
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {cargando ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center opacity-40">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-400 text-sm">
              {filtro ? 'Sin resultados' : 'No hay productos aún'}
            </p>
            {!filtro && (
              <button onClick={() => setModalProducto({})} className="mt-3 text-sky-400 text-xs underline underline-offset-2">
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
              <tr className="border-b border-gray-800">
                {['Producto','Código','Costo','Venta','Stock','Acciones'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${i >= 2 && i <= 4 ? 'text-right' : i === 4 ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <FilaProducto key={p.id} producto={p}
                  onEditar={setModalProducto}
                  onAjustar={setModalAjuste}
                  onEliminar={setConfirmEliminar}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalProducto !== null && (
        <ModalProducto
          producto={modalProducto?.id ? modalProducto : null}
          onGuardar={guardarProducto}
          onCerrar={() => setModalProducto(null)}
        />
      )}

      {modalAjuste && (
        <ModalAjusteStock
          producto={modalAjuste}
          onAjustar={ajustarStock}
          onCerrar={() => setModalAjuste(null)}
        />
      )}

      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xs w-full mx-4 text-center shadow-2xl">
            <div className="text-4xl mb-3">🗑</div>
            <p className="text-white font-semibold mb-1">¿Eliminar producto?</p>
            <p className="text-gray-400 text-xs mb-5">Se dará de baja. El historial de ventas se mantiene.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400
                           hover:bg-gray-800 transition-colors text-sm">Cancelar</button>
              <button onClick={() => handleEliminar(confirmEliminar)}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white
                           font-bold text-sm transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}