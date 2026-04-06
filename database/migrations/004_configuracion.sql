-- ============================================================
--  004_configuracion.sql
--  Tabla de configuración general del kiosco.
--  Patrón key/value: flexible, no requiere migración por cada
--  nuevo ajuste que se agregue en el futuro.
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracion (
  clave         TEXT PRIMARY KEY,
  valor         TEXT NOT NULL DEFAULT '',
  descripcion   TEXT DEFAULT '',
  actualizado_en TEXT DEFAULT (datetime('now'))
);

-- Valores por defecto
INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES
  ('kiosco_nombre',         'Mi Kiosco',  'Nombre del negocio'),
  ('kiosco_telefono',       '',           'Teléfono de contacto'),
  ('kiosco_direccion',      '',           'Dirección del negocio'),
  ('stock_umbral_alerta',   '5',          'Cantidad mínima antes de mostrar alerta de stock bajo'),
  ('moneda_simbolo',        '$',          'Símbolo de moneda a mostrar en precios'),
  ('venta_permite_negativo','0',          '1 = permitir vender sin stock; 0 = bloquear'),
  ('caja_monto_inicial',    '0',          'Monto inicial sugerido al abrir caja');
