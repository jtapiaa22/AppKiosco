-- ============================================================
--  005_roles_pin.sql
--  Agrega configuración de PIN y roles a la tabla configuracion.
--
--  Roles:
--    dueño    → acceso total
--    empleado → solo Venta, Fiados y Clientes
--
--  El PIN se guarda hasheado (SHA-256 en hex) — nunca en texto plano.
--  Si pin_dueno está vacío → la app arranca sin pedir PIN (modo libre).
-- ============================================================

INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES
  ('pin_dueno',    '', 'PIN del dueño (SHA-256 en hex). Vacío = sin PIN'),
  ('pin_empleado', '', 'PIN del empleado (SHA-256 en hex). Vacío = rol empleado no habilitado'),
  ('rol_activo',   '', 'Rol actualmente autenticado: "dueno" | "empleado" | "" (sin PIN configurado)');
