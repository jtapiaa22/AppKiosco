/**
 * src/services/configuracion.js
 *
 * Servicio para leer y escribir configuración del kiosco.
 * La configuración se guarda en la tabla `configuracion` de SQLite.
 *
 * En modo web (sin Electron) usa un objeto en memoria como mock.
 */

const isElectron = () => typeof window !== 'undefined' && Boolean(window.electronAPI)

// Cache en memoria para no ir a la DB en cada lectura
let _cache = null

// ---------------------------------------------------------------------------
// getConfig — devuelve todas las claves como objeto { clave: valor }
// ---------------------------------------------------------------------------
export async function getConfig() {
  if (!isElectron()) return getConfigMock()

  try {
    const rows = await window.electronAPI.dbQuery(
      'SELECT clave, valor FROM configuracion',
      []
    )
    _cache = Object.fromEntries(rows.map(r => [r.clave, r.valor]))
    return _cache
  } catch (err) {
    console.error('[Config] Error al leer configuración:', err)
    return getConfigMock()
  }
}

// ---------------------------------------------------------------------------
// getConfigValue — leer una clave individual
// ---------------------------------------------------------------------------
export async function getConfigValue(clave, fallback = '') {
  // Usar cache si ya fue cargado
  if (_cache && clave in _cache) return _cache[clave]
  const config = await getConfig()
  return config[clave] ?? fallback
}

// ---------------------------------------------------------------------------
// setConfig — guardar un objeto { clave: valor, ... }
// ---------------------------------------------------------------------------
export async function setConfig(cambios) {
  if (!isElectron()) {
    _cache = { ..._cache, ...cambios }
    return { ok: true }
  }

  try {
    const ahora = new Date().toISOString()
    for (const [clave, valor] of Object.entries(cambios)) {
      await window.electronAPI.dbRun(
        `INSERT INTO configuracion (clave, valor, actualizado_en)
         VALUES (?, ?, ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = excluded.actualizado_en`,
        [clave, String(valor), ahora]
      )
    }
    // Invalidar cache
    _cache = null
    return { ok: true }
  } catch (err) {
    console.error('[Config] Error al guardar configuración:', err)
    return { ok: false, error: err.message }
  }
}

// ---------------------------------------------------------------------------
// invalidateCache — forzar recarga desde DB en el próximo getConfig()
// ---------------------------------------------------------------------------
export function invalidateConfigCache() {
  _cache = null
}

// ---------------------------------------------------------------------------
// Mock para desarrollo web
// ---------------------------------------------------------------------------
function getConfigMock() {
  return {
    kiosco_nombre        : 'Mi Kiosco',
    kiosco_telefono      : '',
    kiosco_direccion     : '',
    stock_umbral_alerta  : '5',
    moneda_simbolo       : '$',
    venta_permite_negativo: '0',
    caja_monto_inicial   : '0',
  }
}
