/**
 * api-server.js — Mini servidor HTTPS local para acceso desde el celular
 *
 * Puerto 3001, HTTPS con certificado autofirmado.
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
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')
const os    = require('os')

const PORT      = 3001
const CERT_PATH = path.join(__dirname, 'cert.pem')
const KEY_PATH  = path.join(__dirname, 'key.pem')

// Estado en memoria para el flujo de escaneo
let pendingScan = null  // { codigo, timestamp }

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Servidor ───────────────────────────────────────────────────────────────

function startApiServer(getDB) {
  if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
    console.error('[API] ❌ Certificados SSL no encontrados en electron/cert.pem y electron/key.pem')
    return null
  }

  const sslOptions = {
    key:  fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  }

  const server = https.createServer(sslOptions, async (req, res) => {
    const url    = req.url.split('?')[0]
    const method = req.method

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      return res.end()
    }

    // ── Escáner HTML ───────────────────────────────────────────────────────
    if (method === 'GET' && (url === '/' || url === '/escaner')) {
      const htmlPath = path.join(__dirname, 'escaner.html')
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(fs.readFileSync(htmlPath, 'utf-8'))
      }
      return json(res, 404, { error: 'escaner.html no encontrado' })
    }

    // ── SCAN: el celu manda el código ──────────────────────────────────────
    // POST /api/scan/result  { codigo: "7790895000083" }
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

    // ── SCAN: la PC consulta si hay código pendiente ───────────────────────
    // GET /api/scan/pending
    if (method === 'GET' && url === '/api/scan/pending') {
      if (!pendingScan) return json(res, 200, { pending: false })
      // Expira a los 60 segundos
      if (Date.now() - pendingScan.timestamp > 60000) {
        pendingScan = null
        return json(res, 200, { pending: false })
      }
      const result = { pending: true, codigo: pendingScan.codigo }
      pendingScan = null  // consumir
      return json(res, 200, result)
    }

    // ── SCAN: limpiar pendiente (si la PC cancela) ────────────────────────
    if (method === 'DELETE' && url === '/api/scan/pending') {
      pendingScan = null
      return json(res, 200, { ok: true })
    }

    const db = getDB()

    // ── GET /api/productos ─────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/productos') {
      try {
        const rows = db.prepare('SELECT * FROM productos ORDER BY nombre ASC').all()
        return json(res, 200, rows)
      } catch (e) { return json(res, 500, { error: e.message }) }
    }

    // ── GET /api/productos/:codigo ─────────────────────────────────────────
    const matchCodigo = url.match(/^\/api\/productos\/(.+)$/)
    if (method === 'GET' && matchCodigo) {
      try {
        const codigo = decodeURIComponent(matchCodigo[1])
        const row = db.prepare('SELECT * FROM productos WHERE codigo_barras = ?').get(codigo)
        if (!row) return json(res, 404, { error: 'Producto no encontrado' })
        return json(res, 200, row)
      } catch (e) { return json(res, 500, { error: e.message }) }
    }

    // ── POST /api/productos ────────────────────────────────────────────────
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

    // ── PUT /api/productos/:id ─────────────────────────────────────────────
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
    console.log(`[API] Servidor HTTPS corriendo en https://${ip}:${PORT}`)
    console.log(`[API] Escáner móvil: https://${ip}:${PORT}/escaner`)
    console.log(`[API] Primera vez: aceptá el certificado en el celu`)
  })

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.warn(`[API] Puerto ${PORT} ocupado.`)
    else console.error('[API] Error:', e.message)
  })

  return server
}

module.exports = { startApiServer, getLocalIP }
