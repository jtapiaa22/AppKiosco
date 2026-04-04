export default function PanelAlertas({ fiados, stockBajo, rentabilidad }) {
  return (
    <div className="space-y-3">

      {/* Fiados pendientes */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Fiados pendientes</p>
        {fiados?.cant_clientes > 0 ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-mono text-red-400">
                ${fiados.deuda_total.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                en {fiados.cant_clientes} {fiados.cant_clientes === 1 ? 'cliente' : 'clientes'}
              </p>
            </div>
            <div className="text-3xl opacity-40">📋</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="text-lg">✓</span>
            <p className="text-sm">Sin fiados pendientes</p>
          </div>
        )}
      </div>

      {/* Stock bajo */}
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Stock bajo</p>
        {stockBajo?.length > 0 ? (
          <div className="space-y-2">
            {stockBajo.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-xs text-white truncate max-w-[160px]">{p.nombre}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono
                    ${p.stock_actual === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {p.stock_actual}
                  </span>
                  <span className="text-xs text-gray-600">/ mín {p.stock_minimo}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="text-lg">✓</span>
            <p className="text-sm">Todo el stock en orden</p>
          </div>
        )}
      </div>

      {/* Rentabilidad top */}
      {rentabilidad?.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Mayor ganancia</p>
          <div className="space-y-2">
            {rentabilidad.map((p, i) => {
              const margen = p.ingresos > 0
                ? ((p.ganancia / p.ingresos) * 100).toFixed(0)
                : 0
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className="text-xs text-white truncate flex-1">{p.nombre}</p>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold font-mono text-emerald-400">
                      +${p.ganancia.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-600">{margen}% margen</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}