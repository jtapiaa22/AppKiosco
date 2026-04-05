-- 003_caja_timestamps_y_transferente.sql
-- Agrega columnas faltantes de forma segura (SQLite no soporta IF NOT EXISTS en ALTER TABLE,
-- pero ignoramos el error si ya existen)

-- Columnas de timestamps en cajas
ALTER TABLE cajas ADD COLUMN abierta_en  TEXT DEFAULT (datetime('now'));
ALTER TABLE cajas ADD COLUMN cerrada_en  TEXT;

-- Nombre de quien transfiere (para identificar pagos por transferencia)
ALTER TABLE ventas ADD COLUMN transferente TEXT;
