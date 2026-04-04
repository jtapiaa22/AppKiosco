import { useState } from 'react'

export default function ModalAbono({ cliente, onAbonar, onCerrar }) {
  const [monto, setMonto]   = useState('')
  const [nota, setNota]     = useState('')
  const [modo, setModo]     = useState('parcial') // 'parcial' | 'total'
  const [guardando, setGuardando] = useState(false)

  const montoFinal = modo === 'total'
    ? cliente?.deuda_total
    : parseFloat(monto) || 0

  const deudaRestante = Math.max(0, (cliente?.deuda_total || 0) - montoFinal)
  const esValido = montoFinal > 0 && montoFinal <= (cliente?.deuda_total || 0)

  async function handleConfirmar() {
    if (!esValido) return
    setGuardando(true)
    await onAbonar(cliente.id, montoFinal, nota)
    onCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header con info del cliente */}
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider font-mono mb-0.5">Registrar abono</p>
              <h2 className="font-bold text-white text-base">{cliente?.nombre}</h2>
            </div>
            <button onClick={onCerrar}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400
                         hover:text-white flex items-center justify-center transition-colors text-sm">✕</button>
          </div>
          {/* Deuda actual */}
          <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-gray-500">Deuda total</p>
            <p className="text-2xl font-bold font-mono text-red-400">
              ${cliente?.deuda_total?.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Modo de pago */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setModo('parcial')}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                ${modo === 'parcial'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
              Abono parcial
            </button>
            <button onClick={() => setModo('total')}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                ${modo === 'total'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
              Saldar todo
            </button>
          </div>

          {/* Monto (solo en parcial) */}
          {modo === 'parcial' && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                Monto a abonar
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                <input
                  type="number"
                  autoFocus
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0"
                  max={cliente?.deuda_total}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3
                             text-2xl text-white font-mono text-center
                             focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {parseFloat(monto) > (cliente?.deuda_total || 0) && (
                <p className="text-xs text-amber-400 mt-1 text-center">
                  El abono no puede superar la deuda
                </p>
              )}
            </div>
          )}

          {/* Modo total */}
          {modo === 'total' && (
            <div className="px-4 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
              <p className="text-xs text-sky-400 mb-1">Se saldará la deuda completa</p>
              <p className="text-2xl font-bold font-mono text-sky-300">
                ${cliente?.deuda_total?.toLocaleString('es-AR')}
              </p>
            </div>
          )}

          {/* Preview deuda restante */}
          {esValido && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-xs text-gray-500">Deuda restante</span>
              <span className={`text-xl font-bold font-mono
                ${deudaRestante === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ${deudaRestante.toLocaleString('es-AR')}
                {deudaRestante === 0 && <span className="text-sm ml-1">✓</span>}
              </span>
            </div>
          )}

          {/* Nota opcional */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
              Nota <span className="text-gray-600">(opcional)</span>
            </label>
            <input
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ej: pagó en efectivo, transferencia..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white placeholder-gray-600
                         focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400
                         hover:bg-gray-800 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={handleConfirmar} disabled={guardando || !esValido}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white
                         font-bold text-sm transition-colors disabled:opacity-40">
              {guardando ? 'Registrando...' : `Abonar $${montoFinal.toLocaleString('es-AR')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}