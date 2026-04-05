-- ============================================================
--  002_caja_manual.sql
--  Elimina la caja auto-abierta y agrega campo monto_apertura.
--  Ahora la caja la abre y cierra el usuario manualmente.
-- ============================================================

-- Agregar monto de apertura si no existe
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS monto_apertura REAL NOT NULL DEFAULT 0;

-- Quitar la caja auto-abierta inicial (ya no se usa)
-- La primera caja ahora la crea el usuario al abrir manualmente.
DELETE FROM cajas WHERE id = 1 AND cant_ventas = 0 AND total_efectivo = 0;
