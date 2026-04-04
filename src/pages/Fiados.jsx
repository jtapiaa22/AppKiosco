import { useState } from 'react'
import { useFiados } from '@/hooks/useFiados'
import TarjetaCliente from '@/components/fiados/TarjetaCliente'
import PanelHistorial from '@/components/fiados/PanelHistorial'
import ModalCliente from '@/components/fiados/ModalCliente'
import ModalAbono from '@/components/fiados/ModalAbono'

export default function Fiados() {
  const {
    clientes, cargando,
    filtro, setFiltro,
    soloConDeuda, setSoloConDeuda,
    cargarHistorial, registrarAbono,
    guardarCliente, eliminarCliente,
    totalDeuda,
  } = useFiados()

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [modalCliente, setModalCliente] = useState(null)  // null | {} | cliente
  const [modalAbono, setModalAbono]     = useState(null)  // null | cliente

  function seleccionar(cliente) {
    setClienteSeleccionado(c => c?.id === cliente.id ? null : cliente)
  }

  return (
    <div className="flex h-full bg-gray-950">

      {/* ══ PANEL IZQUIERDO — lista de clientes ══ */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white">Fiados</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {clientes.filter(c => c.deuda_total > 0).length} clientes con deuda
              </p>
            </div>
            <button onClick={() => setModalCliente({})}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500
                         text-white text-sm font-medium transition-colors">
              + Nuevo cliente
            </button>
          </div>

          {/* Resumen de deuda total */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/15">
              <p className="text-xs text-gray-500">Deuda total acumulada</p>
              <p className="text-xl font-bold font-mono text-red-400">
                ${totalDeuda.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-700">
              <p className="text-xs text-gray-500">Clientes registrados</p>
              <p className="text-xl font-bold font-mono text-white">{clientes.length}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={filtro} onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2
                         text-sm text-white placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button onClick={() => setSoloConDeuda(!soloConDeuda)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap
              ${soloConDeuda
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
            Solo con deuda
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cargando ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
              <div className="text-5xl mb-3">👤</div>
              <p className="text-gray-400 text-sm">
                {filtro ? 'Sin resultados' : 'No hay clientes registrados'}
              </p>
              {!filtro && (
                <button onClick={() => setModalCliente({})}
                  className="mt-3 text-amber-400 text-xs underline underline-offset-2">
                  Agregar el primero
                </button>
              )}
            </div>
          ) : (
            clientes.map(c => (
              <TarjetaCliente
                key={c.id}
                cliente={c}
                seleccionado={clienteSeleccionado?.id === c.id}
                onClick={() => seleccionar(c)}
                onAbono={setModalAbono}
              />
            ))
          )}
        </div>
      </div>

      {/* ══ PANEL DERECHO — historial ══ */}
      {clienteSeleccionado && (
        <PanelHistorial
          cliente={clienteSeleccionado}
          cargarHistorial={cargarHistorial}
          onAbono={setModalAbono}
          onEditar={c => setModalCliente(c)}
          onCerrar={() => setClienteSeleccionado(null)}
        />
      )}

      {/* Modales */}
      {modalCliente !== null && (
        <ModalCliente
          cliente={modalCliente?.id ? modalCliente : null}
          onGuardar={guardarCliente}
          onCerrar={() => setModalCliente(null)}
        />
      )}

      {modalAbono && (
        <ModalAbono
          cliente={modalAbono}
          onAbonar={async (id, monto, nota) => {
            await registrarAbono(id, monto, nota)
            // Actualizar el cliente seleccionado si es el mismo
            if (clienteSeleccionado?.id === id) {
              setClienteSeleccionado(c => ({
                ...c,
                deuda_total: Math.max(0, c.deuda_total - monto)
              }))
            }
          }}
          onCerrar={() => setModalAbono(null)}
        />
      )}
    </div>
  )
}