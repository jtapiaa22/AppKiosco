/**
 * src/services/pin.js
 *
 * PIN único de acceso a la app.
 * No hay roles: si sabés el PIN, entrás con acceso total.
 * Si no hay PIN configurado, la app abre directamente.
 *
 * El PIN nunca se guarda en texto plano: se hashea con SHA-256.
 */

import { getConfig, setConfig } from '@/services/configuracion'

// SHA-256 del PIN como string hex
export async function hashPin(pin) {
  const encoded = new TextEncoder().encode(pin)
  const buf     = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// true si hay un PIN configurado
export async function hayPinConfigurado() {
  const config = await getConfig()
  return Boolean(config.pin_acceso)
}

// Guarda el PIN hasheado (pin vacío = eliminar el PIN)
export async function setPin(pinNuevo) {
  const hash = pinNuevo ? await hashPin(pinNuevo) : ''
  return setConfig({ pin_acceso: hash })
}

// Verifica el PIN ingresado. Devuelve true si es correcto, false si no.
export async function verificarPin(pinIngresado) {
  const config = await getConfig()
  if (!config.pin_acceso) return true   // sin PIN → acceso libre
  const hash = await hashPin(pinIngresado)
  return hash === config.pin_acceso
}
