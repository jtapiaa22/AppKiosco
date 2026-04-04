/**
 * barcode.js — Lookup de productos por código de barras
 *
 * Primero busca en la base de datos local (esto lo hace useProductoSearch).
 * Este servicio consulta Open Food Facts como fallback externo.
 */

const OFF_API = 'https://world.openfoodfacts.org/api/v0/product'

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

    // Mapear campos de Open Food Facts al esquema de productos
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
