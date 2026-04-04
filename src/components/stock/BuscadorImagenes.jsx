/**
 * BuscadorImagenes.jsx
 * Busca imagenes usando la API publica de DuckDuckGo Images (sin API key).
 * Muestra un grid de resultados para elegir.
 */
import { useState, useEffect, useRef } from 'react'

// Proxy via allorigins para evitar CORS con DuckDuckGo
async function buscarImagenes(query) {
  // Paso 1: obtener token vqd de DuckDuckGo
  const tokenUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`)}`
  const tokenRes = await fetch(tokenUrl)
  const tokenData = await tokenRes.json()
  const vqdMatch = tokenData.contents?.match(/vqd=['"](\d-[^'"]+)['"]/) ||
                   tokenData.contents?.match(/vqd=(\d-[\w-]+)/)
  if (!vqdMatch) throw new Error('No se pudo obtener token')
  const vqd = vqdMatch[1]

  // Paso 2: buscar imagenes
  const imgUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1&v7exp=a`)}`
  const imgRes = await fetch(imgUrl)
  const imgData = await imgRes.json()
  const parsed = JSON.parse(imgData.contents)
  return (parsed.results || []).slice(0, 24).map(r => ({
    thumb: r.thumbnail,
    url:   r.image,
    title: r.title,
    width: r.width,
    height: r.height,
  }))
}

export default function BuscadorImagenes({ query: initialQuery, onSeleccionar, onCerrar }) {
  const [query, setQuery]       = useState(initialQuery || '')
  const [imagenes, setImagenes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const [seleccionada, setSeleccionada] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (initialQuery) buscar(initialQuery)
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function buscar(q = query) {
    if (!q.trim()) return
    setCargando(true)
    setError('')
    setImagenes([])
    setSeleccionada(null)
    try {
      const results = await buscarImagenes(q)
      if (results.length === 0) setError('No se encontraron imágenes. Intentá otro término.')
      setImagenes(results)
    } catch (e) {
      console.error('[BuscadorImagenes]', e)
      setError('Error al buscar imágenes. Verificá tu conexión a internet.')
    } finally {
      setCargando(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') buscar()
    if (e.key === 'Escape') onCerrar()
  }

  function handleSeleccionar() {
    if (seleccionada) onSeleccionar(seleccionada.url)
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-white text-base">🔍 Buscar imagen</h2>
          <button onClick={onCerrar}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white
                       flex items-center justify-center transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* Barra de busqueda */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-800 flex-shrink-0">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: OFF repelente spray, coca cola lata..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm
                       text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button onClick={() => buscar()} disabled={cargando || !query.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm
                       font-medium transition-colors disabled:opacity-40 flex items-center gap-2">
            {cargando
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '🔍'}
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Grid de imagenes */}
        <div className="overflow-y-auto flex-1 p-4">
          {error && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-amber-400 text-sm">{error}</p>
            </div>
          )}
          {!cargando && imagenes.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-40">
              <p className="text-4xl mb-3">🖼️</p>
              <p className="text-gray-400 text-sm">Ingresá un término para buscar imágenes</p>
            </div>
          )}
          {cargando && (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-800 animate-pulse" />
              ))}
            </div>
          )}
          {!cargando && imagenes.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSeleccionada(img)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                    ${ seleccionada === img
                      ? 'border-violet-500 ring-2 ring-violet-500/40 scale-95'
                      : 'border-transparent hover:border-gray-600'}`}>
                  <img
                    src={img.thumb}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.parentElement.style.display = 'none' }}
                  />
                  {seleccionada === img && (
                    <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-800 flex-shrink-0">
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400
                       hover:bg-gray-800 transition-colors text-sm">Cancelar</button>
          <button onClick={handleSeleccionar} disabled={!seleccionada}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white
                       font-bold text-sm transition-colors disabled:opacity-40">
            Usar esta imagen
          </button>
        </div>
      </div>
    </div>
  )
}
