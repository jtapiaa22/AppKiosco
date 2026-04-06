/**
 * src/services/pin.js
 *
 * Lógica de PIN y roles.
 *
 * Roles:
 *   'dueno'    → acceso total (todas las páginas)
 *   'empleado' → solo Venta, Fiados, Clientes
 *   ''         → sin PIN configurado, acceso total sin pedir nada
 *
 * El PIN nunca se guarda en texto plano: se hashea con SHA-256
 * usando la Web Crypto API (disponible en Electron renderer y en browsers).
 */

import { getConfig, setConfig } from '@/services/configuracion'

// ---------------------------------------------------------------------------
// hashPin — SHA-256 del PIN como string hex
// ---------------------------------------------------------------------------
export async function hashPin(pin) {
  const encoded = new TextEncoder().encode(pin)
  const buf     = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// getPinStatus — estado actual del sistema de PINs
// Devuelve: { tienePinDueno, tienePinEmpleado }
// ---------------------------------------------------------------------------
export async function getPinStatus() {
  const config = await getConfig()
  return {
    tienePinDueno   : Boolean(config.pin_dueno),
    tienePinEmpleado: Boolean(config.pin_empleado),
  }
}

// ---------------------------------------------------------------------------
// setPin — guarda el PIN hasheado para un rol
// rol: 'dueno' | 'empleado'
// ---------------------------------------------------------------------------
export async function setPin(rol, pinNuevo) {
  const clave = rol === 'dueno' ? 'pin_dueno' : 'pin_empleado'
  const hash  = pinNuevo ? await hashPin(pinNuevo) : ''
  return setConfig({ [clave]: hash })
}

// ---------------------------------------------------------------------------
// verificarPin — compara el PIN ingresado con el guardado
// Devuelve el rol si coincide, null si no
// ---------------------------------------------------------------------------
export async function verificarPin(pinIngresado) {
  const config = await getConfig()
  const hash   = await hashPin(pinIngresado)

  if (config.pin_dueno    && hash === config.pin_dueno)    return 'dueno'
  if (config.pin_empleado && hash === config.pin_empleado) return 'empleado'
  return null
}

// ---------------------------------------------------------------------------
// Permisos por rol
// ---------------------------------------------------------------------------
const PERMISOS = {
  dueno   : ['/pos', '/caja', '/stock', '/fiados', '/clientes', '/reportes', '/configuracion'],
  empleado: ['/pos', '/fiados', '/clientes'],
}

export function tienePermiso(rol, ruta) {
  if (!rol) return true  // sin PIN configurado → acceso libre
  return (PERMISOS[rol] ?? []).includes(ruta)
}

export function getRutasPermitidas(rol) {
  if (!rol) return Object.values(PERMISOS).flat()
  return PERMISOS[rol] ?? []
}
