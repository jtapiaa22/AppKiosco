/**
 * barcode.js — Escáner físico + lookup de productos por código de barras
 */

const OFF_API = 'https://world.openfoodfacts.org/api/v0/product'

// ── Mapa de tags OFF → categoría corta en español ────────────────────────────────
const CATEGORIA_MAP = {
  // Bebidas
  'beverages':                    'Bebidas',
  'drinks':                       'Bebidas',
  'carbonated-drinks':            'Gaseosas',
  'sodas':                        'Gaseosas',
  'colas':                        'Gaseosas',
  'non-alcoholic-beverages':      'Bebidas',
  'alcoholic-beverages':          'Bebidas alcohólicas',
  'beers':                        'Cervezas',
  'wines':                        'Vinos',
  'spirits':                      'Licores',
  'juices':                       'Jugos',
  'fruit-juices':                 'Jugos',
  'nectars':                      'Jugos',
  'waters':                       'Agua',
  'mineral-waters':               'Agua',
  'energy-drinks':                'Energízantes',
  'isotonic-drinks':              'Isotónicos',
  'teas':                         'Infusiones',
  'coffees':                      'Café',
  'hot-beverages':                'Infusiones',
  'milks':                        'Lácteos',
  'plant-based-milks':            'Bebida vegetal',
  // Lácteos
  'dairy-products':               'Lácteos',
  'cheeses':                      'Quesos',
  'yogurts':                      'Yogur',
  'butters':                      'Manteca',
  'creams':                       'Cremas',
  'ice-creams':                   'Helados',
  // Snacks y golosinas
  'snacks':                       'Snacks',
  'salty-snacks':                 'Snacks',
  'chips':                        'Papas fritas',
  'crackers':                     'Galletas',
  'biscuits':                     'Galletas',
  'cookies':                      'Galletas',
  'wafers':                       'Obleas',
  'chocolates':                   'Chocolates',
  'chocolate-candies':            'Chocolates',
  'candies':                      'Caramelos',
  'sweets':                       'Golosinas',
  'gummies':                      'Gomitas',
  'lollipops':                    'Chupetines',
  'chewing-gums':                 'Chicles',
  'confectioneries':              'Golosinas',
  // Panadería y cereales
  'breads':                       'Pan',
  'bakery-products':              'Panadería',
  'pastries':                     'Facturas',
  'cakes':                        'Tortas',
  'cereals':                      'Cereales',
  'breakfast-cereals':            'Cereales',
  'granolas':                     'Granola',
  'cereal-bars':                  'Barras cereal',
  'pastas':                       'Pastas',
  // Alimentos básicos
  'rices':                        'Arroz',
  'flours':                       'Harinas',
  'sugars':                       'Azúcar',
  'salts':                        'Sal',
  'oils':                         'Aceites',
  'condiments':                   'Condimentos',
  'sauces':                       'Salsas',
  'vinegars':                     'Vinagre',
  'mustards':                     'Mostaza',
  'ketchups':                     'Ketchup',
  'mayonnaises':                  'Mayonesa',
  // Carnes y proteinas
  'meats':                        'Carnes',
  'poultry':                      'Aves',
  'seafoods':                     'Mariscos',
  'fish':                         'Pescados',
  'eggs':                         'Huevos',
  // Frutas y verduras
  'fruits':                       'Frutas',
  'vegetables':                   'Verduras',
  'legumes':                      'Legumbres',
  'nuts':                         'Frutos secos',
  'dried-fruits':                 'Frutas secas',
  // Congelados y conservas
  'frozen-foods':                 'Congelados',
  'canned-goods':                 'Conservas',
  'preserves':                    'Conservas',
  // Limpieza e higiene
  'cleaning-products':            'Limpieza',
  'household-products':           'Limpieza',
  'personal-care':                'Higiene',
  'hygiene-products':             'Higiene',
  'cosmetics':                    'Cosmética',
  // Otros
  'dietary-supplements':          'Suplementos',
  'baby-foods':                   'Bebés',
  'pet-foods':                    'Mascotas',
  'tobaccos':                     'Tabaco',
  'plant-based-foods':            'Vegano',
  'organic-foods':                'Orgánico',
}

/**
 * Convierte un array de categories_tags de OFF a una categoría corta en español.
 * Estrategia:
 *  1. Recorrer todos los tags buscando coincidencia en CATEGORIA_MAP
 *  2. Si no hay coincidencia, limpiar el tag más específico (el último) y traducirlo
 */
function resolverCategoria(tags = []) {
  if (!tags || tags.length === 0) return ''

  // Normalizar: sacar prefijos de idioma (en:, fr:, es:, etc.)
  const normalized = tags.map(t =>
    t.replace(/^[a-z]{2}:/, '').toLowerCase().trim()
  )

  // 1. Buscar en el mapa empezando por los más genéricos (primeros tags)
  //    OFF pone los tags de lo general a lo específico
  for (const tag of normalized) {
    if (CATEGORIA_MAP[tag]) return CATEGORIA_MAP[tag]
  }

  // 2. Fallback: limpiar el tag más genérico (primero)
  const raw = normalized[0] || ''
  // Reemplazar guón por espacio y capitalizar cada palabra
  const limpio = raw
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  // Truncar a 2 palabras máximo
  return limpio.split(' ').slice(0, 2).join(' ')
}

// ── Escáner físico ────────────────────────────────────────────────────────
export function listenBarcodeScanner(callback) {
  let buffer = ''
  let lastKeyTime = 0
  const SCANNER_SPEED_THRESHOLD = 50
  const MIN_BARCODE_LENGTH = 3

  function onKeyDown(e) {
    const now = Date.now()
    const elapsed = now - lastKeyTime
    lastKeyTime = now

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

    if (e.key.length === 1) buffer += e.key
  }

  window.addEventListener('keydown', onKeyDown, true)
  return () => window.removeEventListener('keydown', onKeyDown, true)
}

// ── Lookup Open Food Facts ───────────────────────────────────────────
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
      categoria:     resolverCategoria(p.categories_tags),
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
