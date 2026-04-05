/**
 * PantallaCajaCerrada.jsx
 * Se muestra en el POS cuando no hay caja abierta.
 * Permite al usuario ingresar el monto de apertura y abrir la caja.
 */
import { useState } from 'react'
import { useCajaStore } from '@/store/cajaStore'
import toast from 'react-hot-toast'

export default function PantallaCajaCerrada() {
  const { abrirCaja } = useCajaStore()
  const [monto, setMonto]       = useState('')
  const [abriendo, setAbriendo] = useState(false)

  async function handleAbrir() {
    const m = parseFloat(monto) || 0
    setAbriendo(true)
    const res = await abrirCaja(m)
    setAbriendo(false)
    if (res.ok) {
      toast.success('¡Caja abierta!')
    } else {
      toast.error('No se pudo abrir la caja')
    }
  }

  return (
    <div className="flex h-full bg-gray-950 items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-6">

        {/* Ícono + título */}
        <div className="text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-white">Caja cerrada</h2>
          <p className="text-sm text-gray-500 mt-1">
            Abrí la caja para empezar a registrar ventas.
          </p>
        </div>

        {/* Monto de apertura */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
            Efectivo en caja al abrir
            <span className="normal-case text-gray-600 ml-1">(opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-lg">$</span>
            <input
              type="number"
              min="0"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAbrir()}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-3
                         font-mono text-white text-xl focus:outline-none focus:ring-2
                         focus:ring-emerald-500 transition-colors placeholder-gray-600"
            />
          </div>
        </div>

        {/* Botón abrir */}
        <button
          onClick={handleAbrir}
          disabled={abriendo}
          className="w-full py-4 rounded-xl font-bold text-base transition-all
                     bg-emerald-600 hover:bg-emerald-500 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed active:scale-95
                     shadow-lg shadow-emerald-900/30"
        >
          {abriendo ? 'Abriendo...' : '🔓 Abrir caja'}
        </button>

        <p className="text-xs text-gray-600 text-center">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}
