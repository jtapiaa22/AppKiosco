import { useState, useEffect, useRef } from 'react'
import { lookupBarcode } from '@/services/barcode'
import BuscadorOFF from '@/components/stock/BuscadorOFF'

const VACIO = {
  codigo_barras: '', nombre: '', descripcion: '',
  foto_url: '', precio_costo: '', precio_venta: '',
  stock_actual: '', stock_minimo: '5', categoria: '',
}

const isElectron = () => typeof window !== 'undefined' && Boolean(window.electronAPI)

async function resolveEscanerUrl() {
  if (isElectron()) {
    const url    = await window.electronAPI.getApiUrl()
    const status = await window.electronAPI.getNgrokStatus()
    return { url, ngrok: status.activo }
  }
  const host = window.location.hostname || 'localhost'
  return { url: `http://${host}:3001/escaner`, ngrok: false }
}

function QRImage({ url }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`}
      alt="QR escaner"
      width={160}
      height={160}
      className="rounded-xl border border-gray-700"
    />
  )
}

export default function ModalProducto({ producto, codigoEscaneado, onGuardar, onCerrar }) {
  const [form, setForm]                       = useState(VACIO)
  const [buscandoBarras, setBuscandoBarras]   = useState(false)
  const [guardando, setGuardando]             = useState(false)
  const [error, setError]                     = useState('')
  const [mostrarBuscador, setMostrarBuscador] = useState(false)

  const [escanerActivo, setEscanerActivo]   = useState(false)
  const [escanerUrl, setEscanerUrl]         = useState('')
  const [escanerMsg, setEscanerMsg]         = useState('')
  const [ngrokActivo, setNgrokActivo]       = useState(false)
  const [cargandoUrl, setCargandoUrl]       = useState(false)
  const pollingRef                          = useRef(null)
  const pollingBaseRef                      = useRef('')

  const esEdicion = Boolean(producto?.id)

  // Inicializar form con producto existente o con codigo recibido por prop
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

  // Si llega un codigo escaneado desde afuera (Stock.jsx polling), autocompleta
  useEffect(() => {
    if (!codigoEscaneado) return
    recibirCodigo(codigoEscaneado)
  }, [codigoEscaneado])

  useEffect(() => () => detenerPolling(), [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Open Food Facts ────────────────────────────────────────────────

  async function buscarEnAPI() {
    if (!form.codigo_barras) return
    setBuscandoBarras(true)
    const datos = await lookupBarcode(form.codigo_barras)
    setBuscandoBarras(false)
    if (datos) {
      setForm(f => ({ ...f, nombre: datos.nombre || f.nombre, foto_url: datos.foto_url || f.foto_url, categoria: datos.categoria || f.categoria }))
    } else {
      setError('No se encontró en Open Food Facts. Completá los datos manualmente.')
      setTimeout(() => setError(''), 3000)
    }
  }

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

  // ── Escáner móvil ──────────────────────────────────────────────────

  async function activarEscanerMovil() {
    setCargandoUrl(true)
    setEscanerActivo(true)
    setEscanerMsg('Obteniendo URL...')
    try {
      const { url, ngrok } = await resolveEscanerUrl()
      setNgrokActivo(ngrok)
      setEscanerUrl(url)
      setEscanerMsg(ngrok ? 'Escaneá el QR con el celular' : 'Escáner en red local — mismo WiFi')

      const base = url.replace('/escaner', '').split('?')[0]
      pollingBaseRef.current = base

      await fetch(`${base}/api/scan/pending`, { method: 'DELETE' }).catch(() => {})

      pollingRef.current = setInterval(async () => {
        try {
          const res  = await fetch(`${base}/api/scan/pending`)
          const data = await res.json()
          if (data.pending && data.codigo) {
            detenerPolling()
            await recibirCodigo(data.codigo)
          }
        } catch { /* silencioso */ }
      }, 1200)
    } catch (e) {
      console.error('[Escáner]', e)
      setEscanerMsg('Error al obtener URL')
    } finally {
      setCargandoUrl(false)
    }
  }

  function detenerPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
  }

  function cancelarEscaner() {
    detenerPolling()
    const base = pollingBaseRef.current
    if (base) fetch(`${base}/api/scan/pending`, { method: 'DELETE' }).catch(() => {})
    setEscanerActivo(false)
    setEscanerMsg('')
  }

  async function recibirCodigo(codigo) {
    setEscanerMsg(`✓ Código recibido: ${codigo}`)
    set('codigo_barras', codigo)
    setBuscandoBarras(true)
    const datos = await lookupBarcode(codigo)
    setBuscandoBarras(false)
    if (datos) {
      setForm(f => ({
        ...f,
        codigo_barras: codigo,
        nombre:        datos.nombre    || f.nombre,
        foto_url:      datos.foto_url  || f.foto_url,
        categoria:     datos.categoria || f.categoria,
      }))
      setEscanerMsg(`✓ Autocompleto — ${datos.nombre || codigo}`)
    } else {
      setForm(f => ({ ...f, codigo_barras: codigo }))
      setEscanerMsg('Código recibido — completá los datos manualmente')
    }
    setTimeout(() => setEscanerActivo(false), 2000)
  }

  // ── Submit ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.precio_venta)  return setError('El precio de venta es obligatorio')
    setGuardando(true); setError('')
    try { await onGuardar(form, producto?.id || null); onCerrar() }
    catch (e) { setError(e.message || 'Error al guardar') }
    finally { setGuardando(false) }
  }

  const margen = form.precio_costo && form.precio_venta
    ? (((parseFloat(form.precio_venta) - parseFloat(form.precio_costo)) / parseFloat(form.precio_costo)) * 100).toFixed(0)
    : null

  return (
    <>
      {mostrarBuscador && (
        <BuscadorOFF onSeleccionar={aplicarDesdeOFF} onCerrar={() => setMostrarBuscador(false)} />
      )}

      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
            <h2 className="font-bold text-white text-base">
              {esEdicion ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setMostrarBuscador(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 border border-sky-500/30 text-sky-300 text-xs font-medium transition-all flex items-center gap-1.5">
                🌍 Buscar en base de datos
              </button>
              <button onClick={onCerrar}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-sm">
                ✕
              </button>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Mensaje de autocomplete por prop externo */}
            {codigoEscaneado && buscandoBarras && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-900/20 border border-violet-700/30">
                <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin block flex-shrink-0" />
                <p className="text-xs text-violet-300">Buscando en Open Food Facts...</p>
              </div>
            )}
            {codigoEscaneado && escanerMsg && !buscandoBarras && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30">
                <span className="text-emerald-400 text-xs">{escanerMsg}</span>
              </div>
            )}

            {/* Código de barras */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Código de barras</label>
              <div className="flex gap-2">
                <input value={form.codigo_barras} onChange={e => set('codigo_barras', e.target.value)}
                  placeholder="Ej: 7790895000083"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <button onClick={buscarEnAPI} disabled={!form.codigo_barras || buscandoBarras}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5">
                  {buscandoBarras ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin block"/> : '🔍'}
                  {buscandoBarras ? 'Buscando...' : 'Buscar API'}
                </button>
              </div>

              {/* Botón escáner — solo en modo nuevo y sin codigo externo */}
              {!esEdicion && !codigoEscaneado && (
                <button onClick={escanerActivo ? cancelarEscaner : activarEscanerMovil} disabled={cargandoUrl}
                  className={`mt-2 w-full py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2
                    ${escanerActivo
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-violet-600/10 border border-violet-500/30 text-violet-300 hover:bg-violet-600/20'}`}>
                  {cargandoUrl
                    ? <><span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin block"/> Obteniendo URL...</>
                    : escanerActivo
                      ? <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse block"/> Cancelar espera</>
                      : <>📱 Escanear con celular</>}
                </button>
              )}

              {/* Panel escáner interno */}
              {escanerActivo && escanerUrl && (
                <div className="mt-2 p-3 rounded-xl bg-violet-900/20 border border-violet-700/30">
                  <p className="text-xs text-violet-300 font-medium flex items-center gap-1.5 mb-3">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse block"/>
                    {escanerMsg}
                  </p>
                  {ngrokActivo ? (
                    <div className="flex flex-col items-center gap-2">
                      <QRImage url={`${escanerUrl}?mode=pc`} />
                      <p className="text-xs text-gray-500 text-center">Escaneá el QR con la cámara del celu</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-1">Desde el celular (mismo WiFi), abrí:</p>
                      <code className="text-xs text-violet-300 bg-gray-800 px-2 py-1 rounded block break-all">
                        {escanerUrl}?mode=pc
                      </code>
                    </>
                  )}
                  {buscandoBarras && (
                    <p className="text-xs text-sky-400 mt-2 flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin block"/>
                      Buscando en Open Food Facts...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Foto */}
            <div className="flex gap-3 items-start">
              <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                {form.foto_url ? <img src={form.foto_url} alt="preview" className="w-full h-full object-cover" /> : <span className="text-3xl opacity-30">📦</span>}
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">URL de foto</label>
                <input value={form.foto_url} onChange={e => set('foto_url', e.target.value)} placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <p className="text-xs text-gray-600 mt-1">Se autocompleta al buscar por código o por nombre</p>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Nombre <span className="text-red-400">*</span></label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del producto"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            {/* Categoría + Descripción */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Categoría</label>
                <input value={form.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Ej: bebidas, snacks..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Descripción</label>
                <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Opcional"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500" />
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
                    <input type="number" value={form.precio_costo} onChange={e => set('precio_costo', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Venta <span className="text-red-400">*</span></p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input type="number" value={form.precio_venta} onChange={e => set('precio_venta', e.target.value)}
                      className="w-full bg-gray-800 border border-emerald-700 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
              {margen !== null && (
                <div className={`mt-2 text-xs font-mono flex items-center gap-1.5
                  ${parseInt(margen) >= 30 ? 'text-emerald-400' : parseInt(margen) >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                  <span>Margen:</span><span className="font-bold">{margen}%</span>
                  <span className="text-gray-600">{parseInt(margen) >= 30 ? '— bueno' : parseInt(margen) >= 10 ? '— ajustado' : '— bajo'}</span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Stock</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Cantidad actual</p>
                  <input type="number" value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Mínimo (alerta)</p>
                  <input type="number" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-800 flex-shrink-0">
            <button onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors text-sm font-medium">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={guardando}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors disabled:opacity-40">
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
