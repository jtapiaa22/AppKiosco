-- ============================================================
--  002_caja_manual.sql
--  Agrega monto_apertura a la tabla cajas.
--
--  NOTA: SQLite no soporta "ALTER TABLE ... ADD COLUMN IF NOT EXISTS".
--  Se agrega la columna directamente; si la migración ya fue aplicada,
--  el sistema de migraciones (_migrations) la saltea automáticamente.
-- ============================================================

ALTER TABLE cajas ADD COLUMN monto_apertura REAL NOT NULL DEFAULT 0;

-- Eliminar la caja auto-abierta inicial si no tiene ventas registradas
DELETE FROM cajas WHERE id = 1 AND cant_ventas = 0 AND total_efectivo = 0;
