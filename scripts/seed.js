/**
 * seed.js — Datos de prueba para desarrollo
 * Uso: npm run db:seed
 *
 * ATENCIÓN: Borra y recarga todos los datos. Solo usar en desarrollo.
 */
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, '../data/kiosco.dev.db')

if (!fs.existsSync(DB_PATH)) {
  console.error('[Seed] ERROR: La DB no existe. Ejecutá primero: npm run db:migrate')
  process.exit(1)
}

const db = new Database(DB_PATH)
db.pragma('foreign_keys = ON')

// Limpiar datos existentes (en orden inverso a FK)
db.exec(`
  DELETE FROM fiados;
  DELETE FROM venta_items;
  DELETE FROM ventas;
  DELETE FROM cajas;
  DELETE FROM clientes;
  DELETE FROM productos;
`)

// ── Productos de ejemplo ──
const insertProducto = db.prepare(`
  INSERT INTO productos (codigo_barras, nombre, descripcion, precio_costo, precio_venta, stock_actual, stock_minimo, categoria)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const productos = [
  ['7790070010001', 'Coca-Cola 600ml',        'Bebida gaseosa',         250,  400,  24, 6,  'Bebidas'],
  ['7790070010002', 'Sprite 600ml',           'Bebida gaseosa',         240,  390,  18, 6,  'Bebidas'],
  ['7790070010003', 'Agua Mineral 500ml',     'Sin gas',                120,  200,  30, 10, 'Bebidas'],
  ['7791239010001', 'Alfajor Havanna',        'Chocolate blanco',       350,  600,  20, 5,  'Alfajores'],
  ['7791239010002', 'Alfajor Milka',          'Chocolate con leche',    280,  450,  25, 5,  'Alfajores'],
  ['7896058510001', 'Papas Fritas Pringles',  'Original 40g',           400,  700,  15, 4,  'Snacks'],
  ['7896058510002', 'Doritos Nacho',          'Queso 55g',              350,  600,  12, 4,  'Snacks'],
  ['7791813010001', 'Chicle Beldent',         'Menta suave',            60,   120,  50, 10, 'Golosinas'],
  ['7791813010002', 'Mentitas',               'Caramelo de menta',      50,   100,  40, 10, 'Golosinas'],
  ['7790895010001', 'Red Bull 250ml',         'Energizante',            600,  950,  10, 3,  'Energizantes'],
  [null,            'Cigarrillos Marlboro',   '20 unidades',            1200, 1800, 8,  2,  'Tabaco'],
  [null,            'Encendedor BIC',         'Colores surtidos',       200,  350,  20, 5,  'Varios'],
  ['7790895010002', 'Café Espresso',          'Vaso descartable',       150,  300,  0,  0,  'Cafetería'],
]

const insertMany = db.transaction(() => {
  for (const p of productos) insertProducto.run(p)
})
insertMany()
console.log(`[Seed] ✅ ${productos.length} productos insertados`)

// ── Clientes de ejemplo ──
const insertCliente = db.prepare(
  `INSERT INTO clientes (nombre, telefono, notas, deuda_total) VALUES (?, ?, ?, ?)`
)

const clientes = [
  ['María González',  '11-4521-0011', 'Vecina de la cuadra',    1500],
  ['Carlos Rodríguez','11-3345-8822', 'Viene todos los días',      0],
  ['Ana López',       null,           '',                        3200],
  ['Pedro Martínez',  '11-6677-9900', 'Paga los viernes',         800],
]

const insertClientes = db.transaction(() => {
  for (const c of clientes) insertCliente.run(c)
})
insertClientes()
console.log(`[Seed] ✅ ${clientes.length} clientes insertados`)

// ── Caja abierta ──
db.prepare(`INSERT INTO cajas (estado) VALUES ('abierta')`).run()
console.log('[Seed] ✅ Caja inicial creada')

console.log('\n[Seed] 🎉 Base de datos lista para desarrollo!')
db.close()
