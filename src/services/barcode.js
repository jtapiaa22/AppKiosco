/**
 * barcode.js — Escáner físico + lookup de productos por código de barras
 *
 * Exporta:
 *   listenBarcodeScanner(callback) → función de cleanup
 *   lookupBarcode(codigo)          → Promise<object|null> (Open Food Facts)
 */

const OFF_API = 'https://world.openfoodfacts.org/api/v0/product'

/**
 * Escucha un escáner físico de código de barras conectado por USB/HID.
 * Los escáneres se comportan como teclados muy rápidos: escriben el código
 * y envían Enter. Se distinguen del tipeo humano por la velocidad entre teclas.
 *
 * @param {(codigo: string) => void} callback - Se llama con el código detectado
 * @returns {() => void} Función de cleanup para remover el listener
 */
export function listenBarcodeScanner(callback) {
  let buffer = ''
  let lastKeyTime = 0

  // Los escáneres físicos envían cada carácter en < 50ms
  const SCANNER_SPEED_THRESHOLD = 50 // ms
  // Longitud mínima para considerar que es un código de barras real
  const MIN_BARCODE_LENGTH = 3

  function onKeyDown(e) {
    const now = Date.now()
    const elapsed = now - lastKeyTime
    lastKeyTime = now

    // Si hay demasiado tiempo entre teclas, resetear el buffer (es tipeo humano)
    if (elapsed > SCANNER_SPEED_THRESHOLD && buffer.length > 0) {
      buffer = ''
    }

    if (e.key === 'Enter') {
      const codigo = buffer.trim()
      buffer = ''
      if (codigo.length >= MIN_BARCODE_LENGTH) {
        e.preventDefault()
        e.stopPropagation()
        callback(codigo)
      }
      return
    }

    // Solo acumular caracteres imprimibles (ignorar Shift, Ctrl, etc.)
    if (e.key.length === 1) {
      buffer += e.key
    }
  }

  window.addEventListener('keydown', onKeyDown, true)

  // Devolver función de cleanup para useEffect
  return () => window.removeEventListener('keydown', onKeyDown, true)
}

/**
 * Busca info de un producto en Open Food Facts por código EAN/UPC.
 * Devuelve un objeto compatible con la tabla `productos`, o null si no encuentra.
 *
 * @param {string} codigo - Código de barras (EAN-13, UPC-A, etc.)
 * @returns {Promise<object|null>}
 */
export async function lookupBarcode(codigo) {
  try {
    const res = await fetch(`${OFF_API}/${codigo}.json`)
    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product

    return {
      codigo_barras: codigo,
      nombre:        p.product_name || p.product_name_es || `Producto ${codigo}`,
      descripcion:   p.generic_name || '',
      foto_url:      p.image_front_small_url || p.image_url || '',
      categoria:     p.categories_tags?.[0]?.replace('en:', '') || '',
      precio_costo:  0,
      precio_venta:  0,
      stock_actual:  0,
      stock_minimo:  5,
    }
  } catch (err) {
    console.warn('[Barcode] Open Food Facts no disponible:', err.message)
    return null
  }
}
