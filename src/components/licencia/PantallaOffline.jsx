export default function PantallaOffline({ info, onContinuar, onReintentar }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                        bg-amber-600/20 border border-amber-500/30 mb-4">
          <span className="text-3xl">📡</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Sin conexión</h1>
        <p className="text-gray-400 text-sm mb-6">
          No se pudo verificar tu licencia en línea. Podés continuar usando KioscoApp
          en modo sin conexión.
        </p>

        {/* Días de gracia */}
        <div className={`px-6 py-4 rounded-2xl border mb-6 ${
          info?.diasRestantes <= 2
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <p className="text-xs text-gray-500 mb-1">Período de gracia restante</p>
          <p className={`text-4xl font-bold font-mono ${
            info?.diasRestantes <= 2 ? 'text-red-400' : 'text-amber-400'
          }`}>
            {info?.diasRestantes ?? '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {info?.diasRestantes === 1 ? 'día' : 'días'}
          </p>
          {info?.diasRestantes <= 2 && (
            <p className="text-xs text-red-400 mt-2">
              ⚠ Conectate a internet pronto para renovar la verificación
            </p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onContinuar}
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white
                       font-bold text-base transition-all active:scale-95"
          >
            Continuar de todos modos
          </button>
          <button
            onClick={onReintentar}
            className="w-full py-3 rounded-xl border border-gray-700 text-gray-400
                       hover:bg-gray-800 hover:text-white transition-all text-sm font-medium"
          >
            Reintentar conexión
          </button>
        </div>

        <p className="text-xs text-gray-700 mt-6">
          La app funciona completamente sin internet. Solo la verificación de licencia requiere conexión.
        </p>
      </div>
    </div>
  )
}