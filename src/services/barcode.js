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
  'dairy-products':               'Lácteos',
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
  'sugars':                       'Azúcar',
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
  'cosmetics':                    'Cosmética',
  'dietary-supplements':          'Suplementos',
  'baby-foods':                   'Bebés',
  'pet-foods':                    'Mascotas',
  'tobaccos':                     'Tabaco',
  'plant-based-foods':            'Vegano',
  'organic-foods':                'Orgánico',
}

/**
 * Sugerencia de categoría basada en palabras clave del nombre del producto.
 * Útil cuando el lookup externo no encuentra el artículo (ej: productos argentinos).
 */
const KEYWORDS_CATEGORIA = [
  // Higiene / Cuidado personal
  { palabras: ['repelente', 'mosquito', 'insect', 'off ', ' off', 'raid', 'baygon', 'aerosol insec'], cat: 'Higiene' },
  { palabras: ['shampoo', 'chamú', 'acondicionador', 'jabon', 'jabón', 'desodorante', 'deo ', 'colonia', 'perfume', 'talco', 'pasta dental', 'cepillo dental', 'hilo dental', 'enjuague', 'crema dental'], cat: 'Higiene' },
  { palabras: ['preservativo', 'condón', 'femenino', 'toallita', 'pañal', 'pañales', 'cottons', 'hisopo'], cat: 'Higiene' },
  { palabras: ['crema corporal', 'humectante', 'protector solar', 'bloqueador', 'maquillaje', 'base maquillaje'], cat: 'Cosmética' },
  // Limpieza del hogar
  { palabras: ['lavandina', 'lavandina', 'detergente', 'limpiador', 'limpia ', 'desengrasante', 'limpiavidrios', 'suavizante', 'desinfectante', 'cloro', 'cif ', 'lysoform', 'ajax', 'fabuloso', 'pinesol'], cat: 'Limpieza' },
  { palabras: ['esponja', 'trapo', 'escoba', 'lampazo', 'bolsa basura', 'rollo cocina', 'papel higiénico', 'servilleta', 'pañuelo descartable', 'kleenex', 'palitos', 'fofó'], cat: 'Limpieza' },
  // Bebidas
  { palabras: ['coca cola', 'pepsi', 'sprite', 'fanta', 'manaos', 'seven up', '7up', 'mirinda', 'schweppes', 'paso de los toros'], cat: 'Gaseosas' },
  { palabras: ['agua mineral', 'villa del sur', 'dasani', 'ser ', 'glaciar', 'villavicencio', 'tomaás', 'evian'], cat: 'Agua' },
  { palabras: ['cerveza', 'quilmes', 'stella artois', 'heineken', 'corona ', 'budweiser', 'andes ', 'schneider', 'brahma'], cat: 'Cervezas' },
  { palabras: ['vino ', 'malbec', 'cabernet', 'chardonnay', 'torrontés', 'merlot', 'tempranillo', 'fernet', 'aperol', 'gancia', 'hesperidina'], cat: 'Bebidas alcohólicas' },
  { palabras: ['jugo ', 'cepita', 'baggio', 'citric', 'beso de frutilla', 'ades', 'multifrutal', 'naranja exprimida'], cat: 'Jugos' },
  { palabras: ['energizante', 'red bull', 'monster ', 'volt ', 'speed ', 'burn '], cat: 'Energízantes' },
  { palabras: ['mate ', 'yerba', 'rosamonte', 'taragui', 'unión ', 'cbse', 'cruz de malta', 'leão', 'playadito'], cat: 'Yerba mate' },
  { palabras: ['café', 'nescafé', 'dolca', 'cabrales café', 'expreso', 'café molido'], cat: 'Café' },
  { palabras: ['té ', 'tê', 'tê verde', 'manzanilla', 'menta poleo', 'boldo', 'tiziane', 'twinings'], cat: 'Infusiones' },
  // Lácteos
  { palabras: ['leche ', 'sancor', 'la serenisima', 'ser leche', 'uat', 'descremada', 'entera', 'deslactosada'], cat: 'Lácteos' },
  { palabras: ['yogur', 'yogurt', 'ilolay', 'activia', 'danone', 'danonino', 'actimel'], cat: 'Yogur' },
  { palabras: ['queso ', 'manteca ', 'crema de leche', 'creme fraiche', 'ricota', 'muzarela', 'mascarpone'], cat: 'Lácteos' },
  // Snacks y golosinas
  { palabras: ['papa frita', 'papas fritas', 'lays', 'pringles', 'doritos', 'cheetos', 'ruffles', 'nachos', 'palitos', 'kraps'], cat: 'Papas fritas' },
  { palabras: ['chocolate', 'kit kat', 'snickers', 'twix', 'milka', 'toblerone', 'cofler', 'cabsha', 'rhodesia', 'mantecol', 'bon o bon'], cat: 'Chocolates' },
  { palabras: ['gomitas', 'gomola', 'mentitas', 'halls', 'tic tac', 'caramelo', 'chupetín', 'chicle', 'trident', 'bubbaloo', 'sugus', 'starburst', 'alfajor', 'oreo', 'galletita'], cat: 'Golosinas' },
  { palabras: ['galletitas', 'galletas', 'bagley', 'terrabusi', 'arcor', 'traviata', 'vocier', 'toddy', 'cerealitas', 'lincoln'], cat: 'Galletas' },
  { palabras: ['manicero', 'maní', 'pipas', 'semillas', 'frutos secos', 'mix de nueces', 'nuez', 'almendra'], cat: 'Frutos secos' },
  // Alimentos
  { palabras: ['fideos', 'tallarín', 'spaghetti', 'mostachol', 'tirabuzón', 'macarrones', 'don vincenzo', 'matarazzo', 'lucchetti'], cat: 'Pastas' },
  { palabras: ['arroz ', 'gallo', 'molinos río', 'la oriz', 'patna'], cat: 'Arroz' },
  { palabras: ['aceite ', 'cocinero', 'natura ', 'el cocinero', 'maravilla', 'oliva', 'girasol'], cat: 'Aceites' },
  { palabras: ['azúcar ', 'ledesma', 'chango', 'endulzante', 'stevia', 'sucralosa', 'aspartamo'], cat: 'Azúcar' },
  { palabras: ['sal ', 'celusal', 'pajarito', 'sal fina', 'sal gruesa', 'sal marina'], cat: 'Sal' },
  { palabras: ['harina ', 'blancaflor', '8 hermanos', 'granix', 'pureza'], cat: 'Harinas' },
  { palabras: ['mayonesa', 'hellmann', 'hellmanns', 'fanesa', 'poirier'], cat: 'Mayonesa' },
  { palabras: ['ketchup', 'salsa de tomate', 'tomate triturado', 'purete', 'puré de tomate'], cat: 'Salsas' },
  // Farmacia / Medicamentos (de libre venta)
  { palabras: ['ibuprofeno', 'paracetamol', 'aspirina', 'tafirol', 'ibupirac', 'bayaspirina', 'analgesi', 'vitamina ', 'redoxon', 'multicentrum', 'suero', 'tiras reactivas'], cat: 'Farmacia' },
  // Cigarrillos / Tabaco
  { palabras: ['cigarrillo', 'marlboro', 'philip morris', 'camel ', 'derby ', 'jockey', 'lucky strike', 'nobleza gaucho', 'tabaco'], cat: 'Cigarrillos' },
  // Mascotas
  { palabras: ['pedigree', 'whiskas', 'eukanuba', 'royal canin', 'dog chow', 'cat chow', 'alimento para perro', 'alimento para gato', 'arena para gatos'], cat: 'Mascotas' },
]

/**
 * Sugiere una categoría analizando palabras clave en el nombre del producto.
 * Devuelve string vacío si no encuentra coincidencia.
 */
export function sugerirCategoria(nombre) {
  if (!nombre) return ''
  const n = nombre.toLowerCase()
  for (const { palabras, cat } of KEYWORDS_CATEGORIA) {
    if (palabras.some(p => n.includes(p))) return cat
  }
  return ''
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

// ── Escaner fisico ──────────────────────────────────────────────────────────
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

// ── Lookup por codigo de barras (OFF) ────────────────────────────────────
export async function lookupBarcode(codigo) {
  try {
    const res = await fetch(`${OFF_API}/${codigo}.json`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    const nombre = p.product_name || p.product_name_es || ''
    const categoria = resolverCategoria(p.categories_tags) || sugerirCategoria(nombre)
    return {
      codigo_barras: codigo,
      nombre,
      descripcion:   p.generic_name || '',
      foto_url:      p.image_front_small_url || p.image_url || '',
      categoria,
    }
  } catch (err) {
    console.warn('[Barcode] OFF no disponible:', err.message)
    return null
  }
}

// ── Lookup por nombre (OFF search) ────────────────────────────────────
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
    const p = productos.find(x => x.product_name || x.product_name_es) || productos[0]
    const nombreFinal = p.product_name || p.product_name_es || nombre
    const categoria = resolverCategoria(p.categories_tags) || sugerirCategoria(nombreFinal)
    return {
      codigo_barras: p.code || '',
      nombre:        nombreFinal,
      descripcion:   p.generic_name || '',
      foto_url:      p.image_front_small_url || p.image_url || '',
      categoria,
    }
  } catch (err) {
    console.warn('[Barcode] OFF search no disponible:', err.message)
    return null
  }
}
