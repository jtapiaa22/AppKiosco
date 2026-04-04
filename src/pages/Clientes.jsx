import { useState } from 'react'
import { useFiados } from '@/hooks/useFiados'
import toast from 'react-hot-toast'

export default function Clientes() {
  const {
    clientes, cargando, filtro, setFiltro,
    guardarCliente, eliminarCliente, totalDeuda,
  } = useFiados()

  const [modal, setModal]   = useState(null) // null | 'nuevo' | { ...cliente }
  const [form, setForm]     = useState({ nombre: '', telefono: '', notas: '' })
  const [guardando, setGuardando] = useState(false)

  function abrirNuevo() {
    setForm({ nombre: '', telefono: '', notas: '' })
    setModal('nuevo')
  }

  function abrirEditar(cliente) {
    setForm({ nombre: cliente.nombre, telefono: cliente.telefono ?? '', notas: cliente.notas ?? '' })
    setModal(cliente)
  }

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setGuardando(true)
    try {
      const esEdicion = modal !== 'nuevo'
      await guardarCliente(form, esEdicion ? modal.id : null)
      toast.success(esEdicion ? 'Cliente actualizado' : 'Cliente creado')
      setModal(null)
    } catch {
      toast.error('No se pudo guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(cliente) {
    if (!confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return
    await eliminarCliente(cliente.id)
    toast.success('Cliente eliminado')
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 p-5 gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-xs text-gray-500">
            {clientes.length} clientes · Deuda total:{' '}
            <span className="text-amber-400 font-mono">
              ${totalDeuda.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500
                     text-white text-sm font-semibold transition-colors"
        >
          <span className="text-base">＋</span> Nuevo cliente
        </button>
      </div>

      {/* ── Buscador ── */}
      <input
        type="search"
        placeholder="Buscar por nombre o teléfono…"
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700
                   text-sm text-white placeholder-gray-500 focus:outline-none
                   focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-colors"
      />

      {/* ── Lista ── */}
      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-600">
          <span className="text-4xl">👤</span>
          <p className="text-sm">
            {filtro ? 'Sin resultados para tu búsqueda' : 'Todavía no hay clientes cargados'}
          </p>
          {!filtro && (
            <button
              onClick={abrirNuevo}
              className="text-sm text-sky-500 hover:text-sky-400 transition-colors"
            >
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-950">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="pb-2 pr-4">Nombre</th>
                <th className="pb-2 pr-4">Teléfono</th>
                <th className="pb-2 pr-4 text-right">Deuda</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {clientes.map(c => (
                <tr key={c.id} className="group hover:bg-gray-900/50 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-white">{c.nombre}</span>
                    {c.notas && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{c.notas}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-400 font-mono">
                    {c.telefono || <span className="text-gray-700">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {c.deuda_total > 0 ? (
                      <span className="text-amber-400 font-mono font-semibold">
                        ${c.deuda_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-xs font-medium">Sin deuda</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => abrirEditar(c)}
                        className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700
                                   text-xs text-gray-300 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(c)}
                        className="px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/60
                                   text-xs text-red-400 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal nuevo/editar ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white">
                {modal === 'nuevo' ? 'Nuevo cliente' : `Editar: ${modal.nombre}`}
              </h2>
            </div>
            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre *</label>
                <input
                  autoFocus
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Juan García"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700
                             text-white text-sm placeholder-gray-600
                             focus:outline-none focus:border-sky-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="Ej: 11-1234-5678"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700
                             text-white text-sm placeholder-gray-600
                             focus:outline-none focus:border-sky-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notas</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Dirección, alias, etc."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700
                             text-white text-sm placeholder-gray-600 resize-none
                             focus:outline-none focus:border-sky-600 transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700
                             text-sm text-gray-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50
                             text-sm text-white font-semibold transition-colors"
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
