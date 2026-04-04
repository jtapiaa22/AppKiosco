export default function FilaProducto({ producto, onEditar, onAjustar, onEliminar }) {
  const stockBajo = producto.stock_actual <= producto.stock_minimo
  const sinStock  = producto.stock_actual === 0

  const margen = producto.precio_costo > 0
    ? (((producto.precio_venta - producto.precio_costo) / producto.precio_costo) * 100).toFixed(0)
    : null

  return (
    <tr className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors group">

      {/* Foto + nombre */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {producto.foto_url
              ? <img src={producto.foto_url} alt={producto.nombre} className="w-full h-full object-cover" />
              : <span className="text-base opacity-40">📦</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate max-w-[200px]">{producto.nombre}</p>
            {producto.categoria && (
              <p className="text-xs text-gray-500 truncate">{producto.categoria}</p>
            )}
          </div>
        </div>
      </td>

      {/* Código de barras */}
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-gray-500">
          {producto.codigo_barras || <span className="italic opacity-40">—</span>}
        </span>
      </td>

      {/* Precios */}
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-mono text-gray-400">
          {producto.precio_costo > 0 ? `$${producto.precio_costo.toLocaleString('es-AR')}` : '—'}
        </p>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="text-sm font-bold font-mono text-emerald-400">
          ${producto.precio_venta.toLocaleString('es-AR')}
        </p>
        {margen !== null && (
          <p className={`text-xs font-mono ${parseInt(margen) >= 30 ? 'text-emerald-600' : parseInt(margen) >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
            +{margen}%
          </p>
        )}
      </td>

      {/* Stock */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className={`text-sm font-bold font-mono
            ${sinStock ? 'text-red-400' : stockBajo ? 'text-amber-400' : 'text-white'}`}>
            {producto.stock_actual}
          </span>
          {(sinStock || stockBajo) && (
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium
              ${sinStock
                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
              {sinStock ? 'sin stock' : 'bajo'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 text-center">mín: {producto.stock_minimo}</p>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAjustar(producto)}
            title="Ajustar stock"
            className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-sky-600 text-gray-300 hover:text-white
                       flex items-center justify-center text-xs transition-colors"
          >±</button>
          <button
            onClick={() => onEditar(producto)}
            title="Editar"
            className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
                       flex items-center justify-center text-xs transition-colors"
          >✏</button>
          <button
            onClick={() => onEliminar(producto.id)}
            title="Eliminar"
            className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white
                       flex items-center justify-center text-xs transition-colors"
          >✕</button>
        </div>
      </td>
    </tr>
  )
}