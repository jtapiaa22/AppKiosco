/**
 * BuscadorOFF.jsx
 * Modal que busca productos por NOMBRE en Open Food Facts
 * y permite elegir uno para autocompletar el formulario.
 */
import { useState, useEffect, useRef } from 'react'
import { resolverCategoriaPublic } from '@/services/barcode'

const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl'

async function buscarEnOFF(termino) {
  const url = new URL(OFF_SEARCH)
  url.searchParams.set('search_terms', termino)
  url.searchParams.set('search_simple', '1')
  url.searchParams.set('action', 'process')
  url.searchParams.set('json', '1')
  url.searchParams.set('page_size', '12')
  url.searchParams.set('fields', 'code,product_name,product_name_es,brands,categories_tags,image_front_small_url,image_url,generic_name')
  url.searchParams.set('lc', 'es')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Error de red')
  const data = await res.json()
  return (data.products || []).filter(p => p.product_name || p.product_name_es)
}

export default function BuscadorOFF({ onSeleccionar, onCerrar }) {
  const [query, setQuery]         = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando]   = useState(false)
  const [error, setError]         = useState('')
  const [buscado, setBuscado]     = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  async function handleBuscar(e) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    setBuscando(true)
    setError('')
    setResultados([])
    setBuscado(false)
    try {
      const items = await buscarEnOFF(q)
      setResultados(items)
      setBuscado(true)
      if (items.length === 0) setError('No se encontraron resultados. Probá con otro término.')
    } catch {
      setError('No se pudo conectar con Open Food Facts. Verificá la conexión.')
    } finally {
      setBuscando(false)
    }
  }

  function elegir(p) {
    const nombre = p.product_name_es || p.product_name || ''
    const marca  = p.brands ? ` (${p.brands.split(',')[0].trim()})` : ''
    onSeleccionar({
      codigo_barras: p.code || '',
      nombre:        nombre + marca,
      descripcion:   p.generic_name || '',
      foto_url:      p.image_front_small_url || p.image_url || '',
      categoria:     resolverCategoriaPublic(p.categories_tags),
    })
    onCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h3 className="font-bold text-white text-sm">Buscar en Open Food Facts</h3>
            <p className="text-xs text-gray-500 mt-0.5">Escribí el nombre o marca del producto</p>
          </div>
          <button onClick={onCerrar}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white
                       flex items-center justify-center transition-colors text-sm flex-shrink-0">
            ✕
          </button>
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleBuscar} className="px-5 py-3 border-b border-gray-800 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ej: Coca Cola, Oreo, Milka..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm
                       text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || buscando}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold
                       transition-colors disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
          >
            {buscando
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
              : <span>🔍</span>
            }
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto px-5 py-3">

          {/* Estado inicial */}
          {!buscado && !buscando && !error && (
            <div className="text-center py-12 opacity-40">
              <div className="text-5xl mb-3">🌎</div>
              <p className="text-gray-400 text-sm">La base de datos tiene más de 3 millones de productos</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center my-4">
              {error}
            </div>
          )}

          {/* Lista de resultados */}
          {resultados.length > 0 && (
            <div className="space-y-2">
              {resultados.map((p, i) => {
                const nombre   = p.product_name_es || p.product_name || 'Sin nombre'
                const marca    = p.brands?.split(',')[0]?.trim() || ''
                const foto     = p.image_front_small_url || p.image_url || ''
                const categoria = resolverCategoriaPublic(p.categories_tags)

                return (
                  <button
                    key={p.code || i}
                    onClick={() => elegir(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-750
                               border border-gray-700 hover:border-sky-500/40 text-left transition-all
                               group active:scale-[0.99]"
                  >
                    {/* Foto */}
                    <div className="w-14 h-14 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0
                                    flex items-center justify-center">
                      {foto
                        ? <img src={foto} alt={nombre} className="w-full h-full object-cover" loading="lazy" />
                        : <span className="text-2xl opacity-40">📦</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-sky-300 transition-colors">
                        {nombre}
                      </p>
                      {marca && (
                        <p className="text-xs text-gray-500 truncate">{marca}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {categoria && (
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                            {categoria}
                          </span>
                        )}
                        {p.code && (
                          <span className="text-xs text-gray-600 font-mono">{p.code}</span>
                        )}
                      </div>
                    </div>

                    {/* Flecha */}
                    <span className="text-gray-600 group-hover:text-sky-400 transition-colors flex-shrink-0">→</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-600 text-center">
            Datos provistos por{' '}
            <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer"
               className="text-sky-600 hover:text-sky-400 transition-colors">
              Open Food Facts
            </a>
            {' '}— base colaborativa y de acceso libre
          </p>
        </div>
      </div>
    </div>
  )
}
