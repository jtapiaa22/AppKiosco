import { useState, useEffect } from 'react'
import { lookupBarcode } from '@/services/barcode'
import BuscadorOFF from '@/components/stock/BuscadorOFF'

const VACIO = {
  codigo_barras: '', nombre: '', descripcion: '',
  foto_url: '', precio_costo: '', precio_venta: '',
  stock_actual: '', stock_minimo: '5', categoria: '',
}

export default function ModalProducto({ producto, onGuardar, onCerrar }) {
  const [form, setForm]               = useState(VACIO)
  const [buscandoBarras, setBuscandoBarras] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const esEdicion = Boolean(producto?.id)

  useEffect(() => {
    if (producto) {
      setForm({
        codigo_barras: producto.codigo_barras || '',
        nombre:        producto.nombre || '',
        descripcion:   producto.descripcion || '',
        foto_url:      producto.foto_url || '',
        precio_costo:  producto.precio_costo?.toString() || '',
        precio_venta:  producto.precio_venta?.toString() || '',
        stock_actual:  producto.stock_actual?.toString() || '',
        stock_minimo:  producto.stock_minimo?.toString() || '5',
        categoria:     producto.categoria || '',
      })
    } else {
      setForm(VACIO)
    }
  }, [producto])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function buscarEnAPI() {
    if (!form.codigo_barras) return
    setBuscandoBarras(true)
    const datos = await lookupBarcode(form.codigo_barras)
    setBuscandoBarras(false)
    if (datos) {
      setForm(f => ({
        ...f,
        nombre:    datos.nombre    || f.nombre,
        foto_url:  datos.foto_url  || f.foto_url,
        categoria: datos.categoria || f.categoria,
      }))
    } else {
      setError('No se encontró en Open Food Facts. Completá los datos manualmente.')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Callback cuando el usuario elige un producto en BuscadorOFF
  function aplicarDesdeOFF(datos) {
    setForm(f => ({
      ...f,
      codigo_barras: datos.codigo_barras || f.codigo_barras,
      nombre:        datos.nombre        || f.nombre,
      descripcion:   datos.descripcion   || f.descripcion,
      foto_url:      datos.foto_url      || f.foto_url,
      categoria:     datos.categoria     || f.categoria,
    }))
  }

  async function handleSubmit() {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.precio_venta)  return setError('El precio de venta es obligatorio')
    setGuardando(true)
    setError('')
    try {
      await onGuardar(form, producto?.id || null)
      onCerrar()
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const margen = form.precio_costo && form.precio_venta
    ? (((parseFloat(form.precio_venta) - parseFloat(form.precio_costo)) / parseFloat(form.precio_costo)) * 100).toFixed(0)
    : null

  return (
    <>
      {/* Buscador OFF (se superpone encima del modal de producto) */}
      {mostrarBuscador && (
        <BuscadorOFF
          onSeleccionar={aplicarDesdeOFF}
          onCerrar={() => setMostrarBuscador(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
            <h2 className="font-bold text-white text-base">
              {esEdicion ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="flex items-center gap-2">
              {/* Botón buscar por nombre — la estrella de esta feature */}
              <button
                onClick={() => setMostrarBuscador(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 border border-sky-500/30
                           text-sky-300 text-xs font-medium transition-all flex items-center gap-1.5"
                title="Buscar en Open Food Facts por nombre"
              >
                🌍 Buscar en base de datos
              </button>
              <button onClick={onCerrar}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400
                           hover:text-white flex items-center justify-center transition-colors text-sm">
                ✕
              </button>
            </div>
          </div>

          {/* Cuerpo scrolleable */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Código de barras + lookup */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                Código de barras
              </label>
              <div className="flex gap-2">
                <input
                  value={form.codigo_barras}
                  onChange={e => set('codigo_barras', e.target.value)}
                  placeholder="Ej: 7790895000083"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                             text-sm text-white font-mono placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  onClick={buscarEnAPI}
                  disabled={!form.codigo_barras || buscandoBarras}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs
                             font-medium transition-colors disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5"
                >
                  {buscandoBarras
                    ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin block"/>
                    : '🔍'
                  }
                  {buscandoBarras ? 'Buscando...' : 'Buscar API'}
                </button>
              </div>
            </div>

            {/* Foto preview + URL */}
            <div className="flex gap-3 items-start">
              <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden
                              flex items-center justify-center flex-shrink-0">
                {form.foto_url
                  ? <img src={form.foto_url} alt="preview" className="w-full h-full object-cover" />
                  : <span className="text-3xl opacity-30">📦</span>
                }
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                  URL de foto
                </label>
                <input
                  value={form.foto_url}
                  onChange={e => set('foto_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                             text-xs text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-600 mt-1">Se autocompleta al buscar por código o por nombre</p>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Nombre del producto"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                           text-sm text-white placeholder-gray-600
                           focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Categoría + descripción */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Categoría</label>
                <input
                  value={form.categoria}
                  onChange={e => set('categoria', e.target.value)}
                  placeholder="Ej: bebidas, snacks..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                             text-sm text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Descripción</label>
                <input
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                             text-sm text-white placeholder-gray-600
                             focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Precios */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Precios</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Costo</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="number" value={form.precio_costo}
                      onChange={e => set('precio_costo', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5
                                 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Venta <span className="text-red-400">*</span></p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="number" value={form.precio_venta}
                      onChange={e => set('precio_venta', e.target.value)}
                      className="w-full bg-gray-800 border border-emerald-700 rounded-xl pl-7 pr-3 py-2.5
                                 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
              {margen !== null && (
                <div className={`mt-2 text-xs font-mono flex items-center gap-1.5
                  ${parseInt(margen) >= 30 ? 'text-emerald-400' : parseInt(margen) >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                  <span>Margen:</span>
                  <span className="font-bold">{margen}%</span>
                  <span className="text-gray-600">
                    {parseInt(margen) >= 30 ? '— bueno' : parseInt(margen) >= 10 ? '— ajustado' : '— bajo'}
                  </span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Stock</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Cantidad actual</p>
                  <input type="number" value={form.stock_actual}
                    onChange={e => set('stock_actual', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                               text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Mínimo (alerta)</p>
                  <input type="number" value={form.stock_minimo}
                    onChange={e => set('stock_minimo', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                               text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-800 flex-shrink-0">
            <button onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400
                         hover:bg-gray-800 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white
                         font-bold text-sm transition-colors disabled:opacity-40">
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
