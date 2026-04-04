import { useState, useEffect, useRef } from 'react'
import { useProductoSearch } from '@/hooks/useProductoSearch'
import { listenBarcodeScanner } from '@/services/barcode'
import { usePosStore } from '@/store/posStore'

export default function BuscadorProducto({ onProductoNuevo }) {
  const [texto, setTexto] = useState('')
  const [flash, setFlash] = useState(false)
  const inputRef = useRef(null)
  const { resultados, cargando, buscarPorTexto, buscarPorCodigo, limpiar } = useProductoSearch()
  const { agregarProducto } = usePosStore()

  // Escuchar escáner físico globalmente
  useEffect(() => {
    const cleanup = listenBarcodeScanner(async (codigo) => {
      setFlash(true)
      setTimeout(() => setFlash(false), 300)
      const { producto, nuevo } = await buscarPorCodigo(codigo)
      if (producto && !nuevo) {
        agregarProducto(producto)
        setTexto('')
        limpiar()
      } else if (nuevo && onProductoNuevo) {
        onProductoNuevo(producto)
      }
    })
    return cleanup
  }, [])

  // Búsqueda por texto con debounce
  useEffect(() => {
    const t = setTimeout(() => buscarPorTexto(texto), 250)
    return () => clearTimeout(t)
  }, [texto])

  const seleccionar = (producto) => {
    agregarProducto(producto)
    setTexto('')
    limpiar()
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className={`relative transition-all duration-200 ${flash ? 'ring-2 ring-emerald-400' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          autoFocus
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Buscar producto o escanear código de barras..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-4 py-3.5
                     text-white placeholder-gray-500 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                     transition-all"
        />
        {cargando && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Indicador modo escáner */}
      <div className="flex items-center gap-2 mt-3 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-gray-500 font-mono">escáner activo — apuntá y saneá</span>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {resultados.map(p => (
            <button
              key={p.id}
              onClick={() => seleccionar(p)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/60
                         hover:bg-gray-700 border border-gray-700/50 hover:border-gray-600
                         transition-all text-left group"
            >
              {/* Foto del producto */}
              <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                  : <span className="text-xl">📦</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-sky-300 transition-colors">
                  {p.nombre}
                </p>
                <p className="text-xs text-gray-500 font-mono">{p.codigo_barras || '—'}</p>
              </div>

              {/* Precio + stock */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  ${p.precio_venta?.toLocaleString('es-AR')}
                </p>
                <p className={`text-xs font-mono ${p.stock_actual <= p.stock_minimo ? 'text-amber-400' : 'text-gray-500'}`}>
                  stock: {p.stock_actual}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Estado vacío — con texto pero sin resultados */}
      {texto.length >= 2 && resultados.length === 0 && !cargando && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-400 text-sm">Sin resultados para <span className="text-white font-mono">"{texto}"</span></p>
          <p className="text-gray-600 text-xs mt-1">¿Es un producto nuevo? Agreálo desde Stock.</p>
        </div>
      )}

      {/* Estado inicial */}
      {texto.length === 0 && resultados.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-40">
          <div className="text-5xl mb-4">▋</div>
          <p className="text-gray-400 text-sm">Escribí o escaneá para buscar</p>
        </div>
      )}
    </div>
  )
}
