/**
 * api-server.js — Mini servidor HTTP local para acceso desde el celular
 *
 * Levanta en el puerto 3001 y expone:
 *   GET  /api/productos          → lista todos los productos
 *   GET  /api/productos/:codigo  → busca por código de barras
 *   POST /api/productos          → crea un producto nuevo
 *   PUT  /api/productos/:id      → edita un producto existente
 *   GET  /escaner                → sirve la mini web para el celular
 *
 * Se llama desde main.js con: startApiServer(getDB)
 */

const http = require('http')
const fs   = require('fs')
const path = require('path')
const os   = require('os')

const PORT = 3001

// ── Helpers ────────────────────────────────────────────────────────────────

function json(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

// Devuelve la IP local de la PC en la red WiFi
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

// ── Servidor ───────────────────────────────────────────────────────────────

function startApiServer(getDB) {
  const server = http.createServer(async (req, res) => {
    const url    = req.url.split('?')[0]
    const method = req.method

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      return res.end()
    }

    // ── Servir la mini web del escáner ────────────────────────────────────
    if (method === 'GET' && (url === '/' || url === '/escaner')) {
      const htmlPath = path.join(__dirname, 'escaner.html')
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(fs.readFileSync(htmlPath, 'utf-8'))
      }
      return json(res, 404, { error: 'escaner.html no encontrado' })
    }

    const db = getDB()

    // ── GET /api/productos ────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/productos') {
      try {
        const rows = db.prepare('SELECT * FROM productos ORDER BY nombre ASC').all()
        return json(res, 200, rows)
      } catch (e) {
        return json(res, 500, { error: e.message })
      }
    }

    // ── GET /api/productos/:codigo ────────────────────────────────────────
    const matchCodigo = url.match(/^\/api\/productos\/(.+)$/)
    if (method === 'GET' && matchCodigo) {
      try {
        const codigo = decodeURIComponent(matchCodigo[1])
        const row = db.prepare(
          'SELECT * FROM productos WHERE codigo_barras = ?'
        ).get(codigo)
        if (!row) return json(res, 404, { error: 'Producto no encontrado' })
        return json(res, 200, row)
      } catch (e) {
        return json(res, 500, { error: e.message })
      }
    }

    // ── POST /api/productos ───────────────────────────────────────────────
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
      } catch (e) {
        return json(res, 500, { error: e.message })
      }
    }

    // ── PUT /api/productos/:id ────────────────────────────────────────────
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
      } catch (e) {
        return json(res, 500, { error: e.message })
      }
    }

    // ── 404 ───────────────────────────────────────────────────────────────
    return json(res, 404, { error: 'Ruta no encontrada' })
  })

  server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP()
    console.log(`[API] Servidor local corriendo en http://${ip}:${PORT}`)
    console.log(`[API] Escáner móvil: http://${ip}:${PORT}/escaner`)
  })

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.warn(`[API] Puerto ${PORT} ocupado, el servidor no pudo iniciar.`)
    } else {
      console.error('[API] Error:', e.message)
    }
  })

  return server
}

module.exports = { startApiServer, getLocalIP }
