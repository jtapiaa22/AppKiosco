/**
 * api-server.js — Servidor HTTP local para acceso desde el celular
 *
 * Puerto 3001, HTTP simple (sin SSL).
 *
 * Rutas:
 *   GET  /escaner                  → sirve la mini web móvil
 *   GET  /api/productos            → lista productos
 *   GET  /api/productos/:codigo    → busca por código
 *   POST /api/productos            → crea producto
 *   PUT  /api/productos/:id        → edita producto
 *
 *   POST /api/scan/result          → el celu manda el código escaneado
 *   GET  /api/scan/pending         → la PC consulta si hay código esperando
 *   DELETE /api/scan/pending       → la PC consume/limpia el código
 *
 *   GET  /api/imagenes?q=...       → busca imágenes via Bing (sin CORS)
 */

const http  = require('http')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const os    = require('os')

const PORT = 3001

let pendingScan = null

// ── Helpers ─────────────────────────────────────────────────────────

function json(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => (data += chunk))
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        ...headers,
      },
    }
    https.get(url, options, (res) => {
      // Seguir redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, headers).then(resolve).catch(reject)
      }
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => resolve(body))
    }).on('error', reject)
  })
}

/**
 * Busca imágenes usando Bing Images (scraping del HTML).
 * Extrae URLs de las miniaturas y las imágenes originales del markup.
 */
async function buscarImagenesBing(query) {
  const q   = encodeURIComponent(query)
  const url = `https://www.bing.com/images/search?q=${q}&form=HDRSC2&first=1&tsc=ImageHoverTitle`
  const html = await fetchText(url, { Referer: 'https://www.bing.com/' })

  const resultados = []

  // Bing embebe los datos de imagen en atributos m (JSON) dentro de los .iusc
  // Formato: <a class="iusc" m='{"murl":"...","turl":"...","t":"..."}' ...>
  const regex = /class="iusc"[^>]+m="([^"]+)"/g
  let match
  while ((match = regex.exec(html)) !== null && resultados.length < 24) {
    try {
      // El atributo está HTML-encoded
      const decoded = match[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
      const data = JSON.parse(decoded)
      if (data.murl) {
        resultados.push({
          url:   data.murl,
          thumb: data.turl || data.murl,
          title: data.t   || query,
        })
      }
    } catch (_) { /* ignorar entradas malformadas */ }
  }

  // Fallback: buscar murl directamente si el regex anterior no matcheo
  if (resultados.length === 0) {
    const murlRegex = /"murl":"([^"]+)"/g
    while ((match = murlRegex.exec(html)) !== null && resultados.length < 24) {
      const url = match[1].replace(/\\u0026/g, '&').replace(/\\\/g, '')
      if (url.startsWith('http')) {
        resultados.push({ url, thumb: url, title: query })
      }
    }
  }

  if (resultados.length === 0) {
    throw new Error('Bing no devolvió imágenes. Verificá la conexión a internet.')
  }

  return resultados
}

// ── Servidor ───────────────────────────────────────────────────────────

function startApiServer(getDB) {
  const server = http.createServer(async (req, res) => {
    const urlParsed = new URL(req.url, `http://localhost:${PORT}`)
    const url    = urlParsed.pathname
    const method = req.method

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      return res.end()
    }

    // ── Escáner HTML ───────────────────────────────────────────────
    if (method === 'GET' && (url === '/' || url === '/escaner')) {
      const htmlPath = path.join(__dirname, 'escaner.html')
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(fs.readFileSync(htmlPath, 'utf-8'))
      }
      return json(res, 404, { error: 'escaner.html no encontrado' })
    }

    // ── GET /api/imagenes?q=... ────────────────────────────────────
    if (method === 'GET' && url === '/api/imagenes') {
      const q = urlParsed.searchParams.get('q') || ''
      if (!q.trim()) return json(res, 400, { error: 'Parámetro q requerido' })
      try {
        const imagenes = await buscarImagenesBing(q)
        return json(res, 200, { ok: true, imagenes })
      } catch (e) {
        console.error('[API] Error búsqueda imágenes:', e.message)
        return json(res, 500, { error: e.message })
      }
    }

    // ── SCAN: el celu manda el código ──────────────────────────────
    if (method === 'POST' && url === '/api/scan/result') {
      try {
        const body = await readBody(req)
        if (!body.codigo) return json(res, 400, { error: 'codigo requerido' })
        pendingScan = { codigo: body.codigo, timestamp: Date.now() }
        console.log(`[API] Código escaneado recibido: ${body.codigo}`)
        return json(res, 200, { ok: true })
      } catch (e) {
        return json(res, 500, { error: e.message })
      }
    }

    // ── SCAN: la PC consulta si hay código pendiente ─────────────────
    if (method === 'GET' && url === '/api/scan/pending') {
      if (!pendingScan) return json(res, 200, { pending: false })
      if (Date.now() - pendingScan.timestamp > 60000) {
        pendingScan = null
        return json(res, 200, { pending: false })
      }
      const result = { pending: true, codigo: pendingScan.codigo }
      pendingScan = null
      return json(res, 200, result)
    }

    // ── SCAN: limpiar pendiente ───────────────────────────────────
    if (method === 'DELETE' && url === '/api/scan/pending') {
      pendingScan = null
      return json(res, 200, { ok: true })
    }

    const db = getDB()

    // ── GET /api/productos ─────────────────────────────────────────
    if (method === 'GET' && url === '/api/productos') {
      try {
        const rows = db.prepare('SELECT * FROM productos ORDER BY nombre ASC').all()
        return json(res, 200, rows)
      } catch (e) { return json(res, 500, { error: e.message }) }
    }

    // ── GET /api/productos/:codigo ─────────────────────────────────
    const matchCodigo = url.match(/^\/api\/productos\/(.+)$/)
    if (method === 'GET' && matchCodigo) {
      try {
        const codigo = decodeURIComponent(matchCodigo[1])
        const row = db.prepare('SELECT * FROM productos WHERE codigo_barras = ?').get(codigo)
        if (!row) return json(res, 404, { error: 'Producto no encontrado' })
        return json(res, 200, row)
      } catch (e) { return json(res, 500, { error: e.message }) }
    }

    // ── POST /api/productos ─────────────────────────────────────────
    if (method === 'POST' && url === '/api/productos') {
      try {
        const body = await readBody(req)
        const {
          codigo_barras = '', nombre = '', descripcion = '',
          foto_url = '', precio_costo = 0, precio_venta = 0,
          stock_actual = 0, stock_minimo = 5, categoria = '',
        } = body
        if (!nombre.trim()) return json(res, 400, { error: 'El nombre es obligatorio' })
        const result = db.prepare(`
          INSERT INTO productos
            (codigo_barras, nombre, descripcion, foto_url,
             precio_costo, precio_venta, stock_actual, stock_minimo, categoria)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          codigo_barras, nombre.trim(), descripcion, foto_url,
          Number(precio_costo), Number(precio_venta),
          Number(stock_actual), Number(stock_minimo), categoria,
        )
        const nuevo = db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid)
        return json(res, 201, nuevo)
      } catch (e) { return json(res, 500, { error: e.message }) }
    }

    // ── PUT /api/productos/:id ──────────────────────────────────────
    const matchId = url.match(/^\/api\/productos\/(\d+)$/)
    if (method === 'PUT' && matchId) {
      try {
        const id   = Number(matchId[1])
        const body = await readBody(req)
        const {
          codigo_barras, nombre, descripcion, foto_url,
          precio_costo, precio_venta, stock_actual, stock_minimo, categoria,
        } = body
        db.prepare(`
          UPDATE productos SET
            codigo_barras = ?, nombre = ?, descripcion = ?, foto_url = ?,
            precio_costo = ?, precio_venta = ?, stock_actual = ?,
            stock_minimo = ?, categoria = ?
          WHERE id = ?
        `).run(
          codigo_barras, nombre, descripcion, foto_url,
          Number(precio_costo), Number(precio_venta),
          Number(stock_actual), Number(stock_minimo), categoria, id,
        )
        const actualizado = db.prepare('SELECT * FROM productos WHERE id = ?').get(id)
        return json(res, 200, actualizado)
      } catch (e) { return json(res, 500, { error: e.message }) }
    }

    return json(res, 404, { error: 'Ruta no encontrada' })
  })

  server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP()
    console.log(`[API] Servidor HTTP corriendo en http://${ip}:${PORT}`)
    console.log(`[API] Escáner móvil:  http://${ip}:${PORT}/escaner`)
    console.log(`[API] Abrí esa URL en Chrome Android (misma red WiFi)`)
  })

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.warn(`[API] Puerto ${PORT} ocupado.`)
    else console.error('[API] Error:', e.message)
  })

  return server
}

module.exports = { startApiServer, getLocalIP }
