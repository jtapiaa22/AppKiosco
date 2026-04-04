import { useState } from 'react'

export default function ModalAjusteStock({ producto, onAjustar, onCerrar }) {
  const [cantidad, setCantidad] = useState('')
  const [tipo, setTipo] = useState('entrada') // 'entrada' | 'salida'
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  const delta = tipo === 'entrada' ? parseInt(cantidad) || 0 : -(parseInt(cantidad) || 0)
  const stockResultante = (producto?.stock_actual || 0) + delta

  async function handleConfirmar() {
    if (!cantidad || parseInt(cantidad) <= 0) return
    setGuardando(true)
    await onAjustar(producto.id, delta)
    onCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
            {producto?.foto_url
              ? <img src={producto.foto_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-lg">📦</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{producto?.nombre}</p>
            <p className="text-xs text-gray-500 font-mono">stock actual: <span className="text-white">{producto?.stock_actual}</span></p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipo('entrada')}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                ${tipo === 'entrada'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
            >
              ↑ Entrada
            </button>
            <button
              onClick={() => setTipo('salida')}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                ${tipo === 'salida'
                  ? 'bg-red-500/15 border-red-500/40 text-red-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}
            >
              ↓ Salida
            </button>
          </div>

          {/* Cantidad */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Cantidad</label>
            <input
              type="number"
              min="1"
              autoFocus
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                         text-2xl text-white font-mono text-center
                         focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Preview resultado */}
          {cantidad && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
              <span className="text-xs text-gray-500">Stock resultante</span>
              <span className={`text-xl font-bold font-mono
                ${stockResultante < 0 ? 'text-red-400' : stockResultante <= (producto?.stock_minimo || 5) ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stockResultante}
              </span>
            </div>
          )}

          {stockResultante < 0 && cantidad && (
            <p className="text-xs text-red-400 text-center">⚠️ El stock no puede quedar negativo</p>
          )}

          <div className="flex gap-3">
            <button onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400
                         hover:bg-gray-800 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={guardando || !cantidad || parseInt(cantidad) <= 0 || stockResultante < 0}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-40
                ${tipo === 'entrada'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-700 hover:bg-red-600 text-white'}`}
            >
              {guardando ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}