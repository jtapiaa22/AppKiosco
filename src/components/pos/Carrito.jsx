import { usePosStore } from '@/store/posStore'

export default function Carrito() {
  const { carrito, cambiarCantidad, eliminarItem, getTotal } = usePosStore()

  if (carrito.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8 opacity-30">
        <div className="text-5xl mb-3">🛒</div>
        <p className="text-gray-400 text-sm">El carrito está vacío</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {carrito.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/50
                       border border-gray-700/30 group"
          >
            {/* Mini foto */}
            <div className="w-9 h-9 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {item.foto_url
                ? <img src={item.foto_url} alt={item.nombre} className="w-full h-full object-cover" />
                : <span className="text-base">📦</span>
              }
            </div>

            {/* Nombre */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate leading-tight">{item.nombre}</p>
              <p className="text-xs text-gray-500 font-mono">
                ${item.precio_venta?.toLocaleString('es-AR')} c/u
              </p>
            </div>

            {/* Control de cantidad */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => cambiarCantidad(item.id, -1)}
                className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white
                           flex items-center justify-center text-sm font-bold transition-colors"
              >−</button>
              <span className="w-8 text-center text-sm font-mono font-bold text-white">
                {item.cantidad}
              </span>
              <button
                onClick={() => cambiarCantidad(item.id, +1)}
                className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-white
                           flex items-center justify-center text-sm font-bold transition-colors"
              >+</button>
            </div>

            {/* Subtotal */}
            <div className="text-right w-20 flex-shrink-0">
              <p className="text-sm font-bold font-mono text-emerald-400">
                ${(item.precio_venta * item.cantidad).toLocaleString('es-AR')}
              </p>
            </div>

            {/* Quitar */}
            <button
              onClick={() => eliminarItem(item.id)}
              className="w-6 h-6 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10
                         flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Totalizador */}
      <div className="border-t border-gray-700 mt-3 pt-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">
              {carrito.reduce((s, i) => s + i.cantidad, 0)} {carrito.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold font-mono text-white">
              ${getTotal().toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
