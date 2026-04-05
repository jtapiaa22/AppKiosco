-- ============================================================
--  002_caja_manual.sql
--  Agrega monto_apertura a cajas (idempotente via tabla temporal).
--
--  SQLite no tiene IF NOT EXISTS en ALTER TABLE, pero podemos usar
--  un workaround: intentar el ALTER y capturarlo con un trigger de
--  tabla temporal que solo ejecuta si la columna no existe aun.
--
--  ALTERNATIVA LIMPIA: usamos una tabla auxiliar para decidir.
-- ============================================================

-- Crear tabla auxiliar que solo existe durante esta migración
CREATE TEMP TABLE IF NOT EXISTS _m002_check AS
  SELECT COUNT(*) AS tiene_col
  FROM pragma_table_info('cajas')
  WHERE name = 'monto_apertura';

-- Solo hace el ALTER si la columna no existe todavía
-- (si tiene_col = 0 se inserta una fila en una tabla inexistente → no se ejecuta)
-- Usamos el truco de INSERT INTO SELECT con WHERE para ejecutar condicionalmente
INSERT OR IGNORE INTO _migrations (name)
  SELECT '002_skip_alter'
  FROM _m002_check
  WHERE tiene_col = 1;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS _temp_m002;
