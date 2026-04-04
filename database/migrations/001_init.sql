-- 001_init.sql — estructura completa inicial de KioscoApp

CREATE TABLE IF NOT EXISTS productos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras  TEXT UNIQUE,
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  foto_url       TEXT,
  precio_costo   REAL DEFAULT 0,
  precio_venta   REAL NOT NULL,
  stock_actual   INTEGER DEFAULT 0,
  stock_minimo   INTEGER DEFAULT 5,
  categoria      TEXT,
  activo         INTEGER DEFAULT 1,
  creado_en      TEXT DEFAULT (datetime('now')),
  actualizado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,
  telefono    TEXT,
  notas       TEXT,
  deuda_total REAL DEFAULT 0,
  activo      INTEGER DEFAULT 1,
  creado_en   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ventas (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id          INTEGER REFERENCES clientes(id),
  total               REAL NOT NULL,
  descuento           REAL DEFAULT 0,
  tipo_pago           TEXT NOT NULL
    CHECK(tipo_pago IN ('efectivo','transferencia','combinado','fiado')),
  monto_efectivo      REAL DEFAULT 0,
  monto_transferencia REAL DEFAULT 0,
  es_fiado            INTEGER DEFAULT 0,
  nota                TEXT,
  vendido_en          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS venta_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id        INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  cantidad        INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal        REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS fiados (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id    INTEGER NOT NULL REFERENCES clientes(id),
  venta_id      INTEGER REFERENCES ventas(id),
  monto         REAL NOT NULL,
  tipo          TEXT NOT NULL CHECK(tipo IN ('deuda','abono')),
  nota          TEXT,
  registrado_en TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cajas (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha                TEXT NOT NULL,
  monto_apertura       REAL DEFAULT 0,
  monto_cierre         REAL,
  total_efectivo       REAL DEFAULT 0,
  total_transferencias REAL DEFAULT 0,
  total_fiados         REAL DEFAULT 0,
  cant_ventas          INTEGER DEFAULT 0,
  estado               TEXT DEFAULT 'abierta'
    CHECK(estado IN ('abierta','cerrada'))
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_productos_barras  ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha      ON ventas(vendido_en);
CREATE INDEX IF NOT EXISTS idx_fiados_cliente    ON fiados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre   ON clientes(nombre);
