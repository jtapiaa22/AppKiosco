/**
 * license.js — Servicio de licencia para el renderer (React)
 *
 * Habla con Electron via window.api.license (expuesto por preload.js)
 * Si no hay Electron (dev web puro), activa modo desarrollo automáticamente.
 */

const isElectron = typeof window !== 'undefined' && !!window.api?.license

/**
 * Verifica el estado actual de la licencia.
 * @returns {Promise<{
 *   dev?:     boolean,
 *   valid:    boolean,
 *   offline?: boolean,
 *   daysLeft?: number,
 *   info?:    object,
 *   reason?:  string
 * }>}
 */
export async function checkLicense() {
  // Sin Electron → modo dev: pasar directo sin validar
  if (!isElectron) {
    return { dev: true, valid: true }
  }

  try {
    const result = await window.api.license.validate()
    return result
  } catch (err) {
    // Error real de IPC: no permitir acceso. El componente mostrara
    // la pantalla de activacion con un mensaje de error de conexion.
    console.error('[License] Error al verificar:', err)
    return { valid: false, reason: 'ipc_error' }
  }
}

/**
 * Intenta activar una licencia con la clave provista.
 * @param {string} key - Clave de activación
 * @returns {Promise<{ valid: boolean, info?: object, reason?: string }>}
 */
export async function activateLicense(key) {
  if (!isElectron) {
    // En dev web, simular activación exitosa
    return { valid: true, info: { plan: 'dev', email: 'dev@local' } }
  }

  try {
    const result = await window.api.license.activate(key)
    return result
  } catch (err) {
    console.error('[License] Error al activar:', err)
    return { valid: false, reason: 'no_electron' }
  }
}
