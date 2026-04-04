/**
 * barcode.js — Escaner fisico + lookup de productos por codigo o nombre
 */

const OFF_API      = 'https://world.openfoodfacts.org/api/v0/product'
const OFF_SEARCH   = 'https://world.openfoodfacts.org/cgi/search.pl'

const CATEGORIA_MAP = {
  'beverages':                    'Bebidas',
  'drinks':                       'Bebidas',
  'carbonated-drinks':            'Gaseosas',
  'sodas':                        'Gaseosas',
  'colas':                        'Gaseosas',
  'non-alcoholic-beverages':      'Bebidas',
  'alcoholic-beverages':          'Bebidas alcohólicas',
  'beers':                        'Cervezas',
  'wines':                        'Vinos',
  'spirits':                      'Licores',
  'juices':                       'Jugos',
  'fruit-juices':                 'Jugos',
  'nectars':                      'Jugos',
  'waters':                       'Agua',
  'mineral-waters':               'Agua',
  'energy-drinks':                'Energízantes',
  'isotonic-drinks':              'Isotónicos',
  'teas':                         'Infusiones',
  'coffees':                      'Café',
  'hot-beverages':                'Infusiones',
  'milks':                        'Lácteos',
  'plant-based-milks':            'Bebida vegetal',
  'dairy-products':               'Lácteos',
  'cheeses':                      'Quesos',
  'yogurts':                      'Yogur',
  'butters':                      'Manteca',
  'creams':                       'Cremas',
  'ice-creams':                   'Helados',
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
  'breads':                       'Pan',
  'bakery-products':              'Panadería',
  'pastries':                     'Facturas',
  'cakes':                        'Tortas',
  'cereals':                      'Cereales',
  'breakfast-cereals':            'Cereales',
  'granolas':                     'Granola',
  'cereal-bars':                  'Barras cereal',
  'pastas':                       'Pastas',
  'rices':                        'Arroz',
  'flours':                       'Harinas',
  'sugars':                       'Azúcar',
  'salts':                        'Sal',
  'oils':                         'Aceites',
  'condiments':                   'Condimentos',
  'sauces':                       'Salsas',
  'vinegars':                     'Vinagre',
  'mustards':                     'Mostaza',
  'ketchups':                     'Ketchup',
  'mayonnaises':                  'Mayonesa',
  'meats':                        'Carnes',
  'poultry':                      'Aves',
  'seafoods':                     'Mariscos',
  'fish':                         'Pescados',
  'eggs':                         'Huevos',
  'fruits':                       'Frutas',
  'vegetables':                   'Verduras',
  'legumes':                      'Legumbres',
  'nuts':                         'Frutos secos',
  'dried-fruits':                 'Frutas secas',
  'frozen-foods':                 'Congelados',
  'canned-goods':                 'Conservas',
  'preserves':                    'Conservas',
  'cleaning-products':            'Limpieza',
  'household-products':           'Limpieza',
  'personal-care':                'Higiene',
  'hygiene-products':             'Higiene',
  'cosmetics':                    'Cosmética',
  'dietary-supplements':          'Suplementos',
  'baby-foods':                   'Bebés',
  'pet-foods':                    'Mascotas',
  'tobaccos':                     'Tabaco',
  'plant-based-foods':            'Vegano',
  'organic-foods':                'Orgánico',
}

export function resolverCategoriaPublic(tags = []) {
  if (!tags || tags.length === 0) return ''
  const normalized = tags.map(t => t.replace(/^[a-z]{2}:/, '').toLowerCase().trim())
  for (const tag of normalized) {
    if (CATEGORIA_MAP[tag]) return CATEGORIA_MAP[tag]
  }
  const raw = normalized[0] || ''
  return raw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).split(' ').slice(0, 2).join(' ')
}

const resolverCategoria = resolverCategoriaPublic

// ── Escaner fisico ───────────────────────────────────────────────────────
export function listenBarcodeScanner(callback) {
  let buffer = ''
  let lastKeyTime = 0
  const SCANNER_SPEED_THRESHOLD = 50
  const MIN_BARCODE_LENGTH = 3

  function onKeyDown(e) {
    const now = Date.now()
    const elapsed = now - lastKeyTime
    lastKeyTime = now
    if (elapsed > SCANNER_SPEED_THRESHOLD && buffer.length > 0) buffer = ''
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

// ── Lookup por codigo de barras (OFF) ─────────────────────────────────
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
    }
  } catch (err) {
    console.warn('[Barcode] OFF no disponible:', err.message)
    return null
  }
}

// ── Lookup por nombre (OFF search) ──────────────────────────────────
export async function lookupByName(nombre) {
  try {
    const params = new URLSearchParams({
      search_terms:    nombre,
      search_simple:   '1',
      action:          'process',
      json:            '1',
      page_size:       '5',
      fields:          'product_name,product_name_es,generic_name,image_front_small_url,image_url,categories_tags,code',
    })
    const res = await fetch(`${OFF_SEARCH}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const productos = data.products || []
    if (productos.length === 0) return null
    // Tomar el primero con nombre
    const p = productos.find(x => x.product_name || x.product_name_es) || productos[0]
    return {
      codigo_barras: p.code || '',
      nombre:        p.product_name || p.product_name_es || nombre,
      descripcion:   p.generic_name || '',
      foto_url:      p.image_front_small_url || p.image_url || '',
      categoria:     resolverCategoria(p.categories_tags),
    }
  } catch (err) {
    console.warn('[Barcode] OFF search no disponible:', err.message)
    return null
  }
}
