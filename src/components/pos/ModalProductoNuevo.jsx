import { useState } from 'react'
import { dbRun } from '@/services/database'
import { usePosStore } from '@/store/posStore'

export default function ModalProductoNuevo({ producto, onClose, onGuardado }) {
  const { agregarItem } = usePosStore()
  const [form, setForm] = useState({
    nombre:       producto?.nombre || '',
    precio_venta: '',
    precio_costo: '',
    stock_actual: '1',
    stock_minimo: '5',
  })
  const [guardando, setGuardando] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleGuardar() {
    if (!form.nombre || !form.precio_venta) return
    setGuardando(true)
    try {
      const res = await dbRun(
        `INSERT INTO productos (codigo_barras, nombre, foto_url, precio_venta, precio_costo, stock_actual, stock_minimo, categoria)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          producto.codigo_barras,
          form.nombre,
          producto.foto_url || '',
          parseFloat(form.precio_venta),
          parseFloat(form.precio_costo) || 0,
          parseInt(form.stock_actual) || 0,
          parseInt(form.stock_minimo) || 5,
          producto.categoria || '',
        ]
      )
      const productoGuardado = {
        id: res.lastInsertRowid,
        ...form,
        codigo_barras: producto.codigo_barras,
        foto_url: producto.foto_url,
        precio_venta: parseFloat(form.precio_venta),
      }
      agregarItem(productoGuardado)
      onGuardado?.(productoGuardado)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {producto?.foto_url && (
            <img src={producto.foto_url} alt={form.nombre}
              className="w-14 h-14 rounded-xl object-cover border border-gray-700" />
          )}
          <div>
            <p className="text-xs text-amber-400 uppercase tracking-wider font-mono">Producto nuevo</p>
            <p className="text-sm text-gray-300 truncate max-w-[180px]">{form.nombre}</p>
            <p className="text-xs text-gray-600 font-mono">{producto?.codigo_barras}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nombre del producto</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm
                         text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio de venta *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input type="number" value={form.precio_venta} onChange={e => set('precio_venta', e.target.value)}
                  className="w-full bg-gray-800 border border-emerald-700 rounded-xl pl-7 pr-3 py-2.5
                             text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio de costo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input type="number" value={form.precio_costo} onChange={e => set('precio_costo', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5
                             text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Stock inicial</label>
              <input type="number" value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                           text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Stock mínimo</label>
              <input type="number" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                           text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400
                       hover:bg-gray-800 transition-colors text-sm font-medium">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando || !form.precio_venta}
            className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white
                       font-bold text-sm transition-colors disabled:opacity-40">
            {guardando ? 'Guardando...' : 'Guardar y agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
