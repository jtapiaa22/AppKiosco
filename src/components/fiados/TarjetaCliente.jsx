export default function TarjetaCliente({ cliente, seleccionado, onClick, onAbono }) {
  const tieneDeuda  = cliente.deuda_total > 0
  const deudaGrande = cliente.deuda_total >= 5000

  return (
    // div en lugar de <button> para evitar nested buttons (el botón "abonar" está adentro)
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer
        ${seleccionado
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'}`}
    >
      <div className="flex items-center justify-between gap-3">

        {/* Avatar inicial */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center
                         text-sm font-bold flex-shrink-0
          ${tieneDeuda ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {cliente.nombre.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{cliente.nombre}</p>
          {cliente.telefono && (
            <p className="text-xs text-gray-500 font-mono">{cliente.telefono}</p>
          )}
        </div>

        {/* Deuda + botón abonar */}
        <div className="text-right flex-shrink-0">
          {tieneDeuda ? (
            <>
              <p className={`text-sm font-bold font-mono
                ${deudaGrande ? 'text-red-400' : 'text-amber-400'}`}>
                ${cliente.deuda_total.toLocaleString('es-AR')}
              </p>
              <button
                onClick={e => { e.stopPropagation(); onAbono(cliente) }}
                className="text-xs text-emerald-500 hover:text-emerald-400
                           transition-colors mt-0.5 block"
              >
                abonar →
              </button>
            </>
          ) : (
            <span className="text-xs text-emerald-500 font-mono">sin deuda ✓</span>
          )}
        </div>

      </div>
    </div>
  )
}
