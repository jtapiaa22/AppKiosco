export default function TopProductos({ productos }) {
  if (!productos || productos.length === 0) {
    return (
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Productos más vendidos</p>
        <div className="flex items-center justify-center h-24 opacity-30">
          <p className="text-gray-500 text-sm">Sin datos en el período</p>
        </div>
      </div>
    )
  }

  const maxUnidades = Math.max(...productos.map(p => p.unidades))

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Productos más vendidos</p>
      <div className="space-y-3">
        {productos.map((p, i) => {
          const pct = Math.round((p.unidades / maxUnidades) * 100)
          return (
            <div key={i} className="flex items-center gap-3">
              {/* Posición */}
              <span className={`text-xs font-bold font-mono w-5 text-center flex-shrink-0
                ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-600'}`}>
                {i + 1}
              </span>

              {/* Foto */}
              <div className="w-8 h-8 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                  : <span className="text-sm opacity-40">📦</span>
                }
              </div>

              {/* Nombre + barra */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white truncate max-w-[140px]">{p.nombre}</p>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-500 font-mono">{p.unidades} u</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ${p.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}