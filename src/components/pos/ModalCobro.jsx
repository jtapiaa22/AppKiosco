import { useState, useEffect } from 'react'
import { usePosStore } from '@/store/posStore'
import { useVenta } from '@/hooks/useVenta'
import { dbQuery } from '@/services/database'

const TIPOS = [
  { id: 'efectivo',       label: 'Efectivo',       emoji: '💵', color: 'emerald' },
  { id: 'transferencia',  label: 'Transferencia',  emoji: '📱', color: 'sky' },
  { id: 'combinado',      label: 'Combinado',      emoji: '💳', color: 'violet' },
  { id: 'fiado',          label: 'Fiado',           emoji: '📝', color: 'amber' },
]

const colorMap = {
  emerald: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
  sky:     'border-sky-500 bg-sky-500/10 text-sky-300',
  violet:  'border-violet-500 bg-violet-500/10 text-violet-300',
  amber:   'border-amber-500 bg-amber-500/10 text-amber-300',
}

export default function ModalCobro({ onClose, onExito }) {
  const { getTotal, clienteSeleccionado, setCliente } = usePosStore()
  const { confirmarVenta, procesando } = useVenta()
  const [tipo, setTipo] = useState('efectivo')
  const [efectivo, setEfectivo] = useState('')
  const [transferencia, setTransferencia] = useState('')
  const [clientes, setClientes] = useState([])
  const [busqCliente, setBusqCliente] = useState('')
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [exito, setExito] = useState(null)

  const total = getTotal()

  // Cargar clientes para fiado/combinado
  useEffect(() => {
    if (tipo === 'fiado' || tipo === 'combinado') {
      dbQuery(
        `SELECT id, nombre, telefono, deuda_total FROM clientes
         WHERE activo = 1 AND nombre LIKE ?
         ORDER BY nombre LIMIT 10`,
        [`%${busqCliente}%`]
      ).then(setClientes)
    }
  }, [busqCliente, tipo])

  // Auto-completar efectivo con el total
  useEffect(() => {
    if (tipo === 'efectivo') setEfectivo(total.toString())
    if (tipo === 'transferencia') setTransferencia(total.toString())
  }, [tipo, total])

  const vuelto = tipo === 'efectivo'
    ? Math.max(0, (parseFloat(efectivo) || 0) - total)
    : tipo === 'combinado'
      ? Math.max(0, (parseFloat(efectivo) || 0) + (parseFloat(transferencia) || 0) - total)
      : 0

  async function handleConfirmar() {
    const res = await confirmarVenta({
      tipoPago: tipo,
      montoEfectivo: tipo === 'efectivo' ? total : parseFloat(efectivo) || 0,
      montoTransferencia: tipo === 'transferencia' ? total : parseFloat(transferencia) || 0,
    })
    if (res.ok) {
      setExito(res)
      setTimeout(() => { onExito?.(res); onClose() }, 1800)
    }
  }

  // Pantalla de éxito
  if (exito) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-emerald-500/40 rounded-2xl p-10 text-center max-w-sm w-full mx-4
                        shadow-2xl shadow-emerald-900/30 animate-bounce-once">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-2xl font-bold text-white mb-1">¡Venta registrada!</p>
          <p className="text-3xl font-mono font-bold text-emerald-400">
            ${exito.total.toLocaleString('es-AR')}
          </p>
          {vuelto > 0 && (
            <p className="mt-3 text-lg text-amber-300 font-mono">
              Vuelto: ${vuelto.toLocaleString('es-AR')}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4
                      shadow-2xl flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Cobrar</h2>
            <p className="text-3xl font-mono font-bold text-emerald-400 mt-0.5">
              ${total.toLocaleString('es-AR')}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400
                       hover:text-white flex items-center justify-center transition-colors">
            ✕
          </button>
        </div>

        {/* Tipo de pago */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Forma de pago</p>
          <div className="grid grid-cols-4 gap-2">
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => setTipo(t.id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium
                            transition-all ${tipo === t.id ? colorMap[t.color] : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}>
                <span className="text-xl">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Montos según tipo */}
        {tipo === 'efectivo' && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recibido</p>
            <input type="number" value={efectivo} onChange={e => setEfectivo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 font-mono
                         text-white text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {vuelto > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                <p className="text-xs text-amber-400 uppercase tracking-wider">Vuelto</p>
                <p className="text-2xl font-bold font-mono text-amber-300">${vuelto.toLocaleString('es-AR')}</p>
              </div>
            )}
          </div>
        )}

        {tipo === 'transferencia' && (
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
            <p className="text-sky-300 text-sm">Confirmar transferencia por</p>
            <p className="text-2xl font-bold font-mono text-sky-200">${total.toLocaleString('es-AR')}</p>
          </div>
        )}

        {tipo === 'combinado' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Efectivo</p>
              <input type="number" value={efectivo} onChange={e => setEfectivo(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 font-mono
                           text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Transferencia</p>
              <input type="number" value={transferencia} onChange={e => setTransferencia(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 font-mono
                           text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            {/* Suma parcial */}
            <div className={`flex justify-between text-sm font-mono px-1
              ${((parseFloat(efectivo)||0)+(parseFloat(transferencia)||0)) >= total ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span>Suma:</span>
              <span>${((parseFloat(efectivo)||0)+(parseFloat(transferencia)||0)).toLocaleString('es-AR')} / ${total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        )}

        {tipo === 'fiado' && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Cliente</p>
            <input value={busqCliente} onChange={e => { setBusqCliente(e.target.value); setMostrarClientes(true) }}
              onFocus={() => setMostrarClientes(true)}
              placeholder="Buscar cliente..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {mostrarClientes && clientes.length > 0 && (
              <div className="mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {clientes.map(c => (
                  <button key={c.id} onClick={() => { setCliente(c); setBusqCliente(c.nombre); setMostrarClientes(false) }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-700
                               text-sm text-left border-b border-gray-700/50 last:border-0 transition-colors">
                    <div>
                      <p className="text-white font-medium">{c.nombre}</p>
                      <p className="text-xs text-gray-500">{c.telefono || '—'}</p>
                    </div>
                    {c.deuda_total > 0 && (
                      <span className="text-xs font-mono text-red-400">
                        debe ${c.deuda_total.toLocaleString('es-AR')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {clienteSeleccionado && (
              <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">
                  Se anotará ${total.toLocaleString('es-AR')} como fiado a <strong>{clienteSeleccionado.nombre}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botón confirmar */}
        <button
          onClick={handleConfirmar}
          disabled={procesando || (tipo === 'fiado' && !clienteSeleccionado)}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all
                     bg-emerald-600 hover:bg-emerald-500 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-95"
        >
          {procesando ? 'Procesando...' : `Confirmar $${total.toLocaleString('es-AR')}`}
        </button>
      </div>
    </div>
  )
}
