-- ============================================================
--  001_initial.sql — Esquema inicial de KioscoApp
--  Tablas: productos, clientes, ventas, venta_items, fiados, cajas
-- ============================================================

-- Productos del kiosco
CREATE TABLE IF NOT EXISTS productos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras  TEXT    UNIQUE,
  nombre         TEXT    NOT NULL,
  descripcion    TEXT    DEFAULT '',
  foto_url       TEXT    DEFAULT '',
  precio_costo   REAL    NOT NULL DEFAULT 0,
  precio_venta   REAL    NOT NULL DEFAULT 0,
  stock_actual   INTEGER NOT NULL DEFAULT 0,
  stock_minimo   INTEGER NOT NULL DEFAULT 5,
  categoria      TEXT    DEFAULT '',
  activo         INTEGER NOT NULL DEFAULT 1,
  creado_en      TEXT    DEFAULT (datetime('now')),
  actualizado_en TEXT    DEFAULT (datetime('now'))
);

-- Clientes (para fiados)
CREATE TABLE IF NOT EXISTS clientes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  telefono    TEXT,
  notas       TEXT,
  deuda_total REAL    NOT NULL DEFAULT 0,
  activo      INTEGER NOT NULL DEFAULT 1,
  creado_en   TEXT    DEFAULT (datetime('now'))
);

-- Cajas diarias
CREATE TABLE IF NOT EXISTS cajas (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  estado               TEXT NOT NULL DEFAULT 'abierta',  -- 'abierta' | 'cerrada'
  total_efectivo       REAL NOT NULL DEFAULT 0,
  total_transferencias REAL NOT NULL DEFAULT 0,
  total_fiados         REAL NOT NULL DEFAULT 0,
  cant_ventas          INTEGER NOT NULL DEFAULT 0,
  abierta_en           TEXT DEFAULT (datetime('now')),
  cerrada_en           TEXT
);

-- Ventas
CREATE TABLE IF NOT EXISTS ventas (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id          INTEGER REFERENCES clientes(id),
  total               REAL    NOT NULL DEFAULT 0,
  tipo_pago           TEXT    NOT NULL DEFAULT 'efectivo', -- 'efectivo' | 'transferencia' | 'mixto' | 'fiado'
  monto_efectivo      REAL    NOT NULL DEFAULT 0,
  monto_transferencia REAL    NOT NULL DEFAULT 0,
  es_fiado            INTEGER NOT NULL DEFAULT 0,
  vendido_en          TEXT    DEFAULT (datetime('now'))
);

-- Ítems de cada venta
CREATE TABLE IF NOT EXISTS venta_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id         INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id      INTEGER NOT NULL REFERENCES productos(id),
  cantidad         INTEGER NOT NULL DEFAULT 1,
  precio_unitario  REAL    NOT NULL,
  subtotal         REAL    NOT NULL
);

-- Movimientos de fiados (deudas y abonos)
CREATE TABLE IF NOT EXISTS fiados (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
  venta_id       INTEGER REFERENCES ventas(id),
  monto          REAL    NOT NULL,
  tipo           TEXT    NOT NULL DEFAULT 'deuda',  -- 'deuda' | 'abono'
  nota           TEXT    DEFAULT '',
  registrado_en  TEXT    DEFAULT (datetime('now'))
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_nombre       ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_codigo       ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_ventas_vendido_en      ON ventas(vendido_en);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id   ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_fiados_cliente_id      ON fiados(cliente_id);

-- Caja inicial abierta (se abre automáticamente al crear la DB)
INSERT OR IGNORE INTO cajas (id, estado) VALUES (1, 'abierta');
