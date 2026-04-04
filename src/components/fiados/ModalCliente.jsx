import { useState, useEffect } from 'react'

export default function ModalCliente({ cliente, onGuardar, onCerrar }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', notas: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const esEdicion = Boolean(cliente?.id)

  useEffect(() => {
    setForm({
      nombre:   cliente?.nombre   || '',
      telefono: cliente?.telefono || '',
      notas:    cliente?.notas    || '',
    })
  }, [cliente])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    setGuardando(true)
    setError('')
    try {
      await onGuardar(form, cliente?.id || null)
      onCerrar()
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white text-base">
            {esEdicion ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <button onClick={onCerrar}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400
                       hover:text-white flex items-center justify-center transition-colors text-sm">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Nombre completo"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white placeholder-gray-600
                         focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Teléfono</label>
            <input
              value={form.telefono}
              onChange={e => set('telefono', e.target.value)}
              placeholder="Ej: 11 2345-6789"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white placeholder-gray-600 font-mono
                         focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder="Dirección, referencia, etc."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                         text-sm text-white placeholder-gray-600 resize-none
                         focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400
                         hover:bg-gray-800 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white
                         font-bold text-sm transition-colors disabled:opacity-40">
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar' : 'Crear cliente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}