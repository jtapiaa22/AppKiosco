/**
 * src/context/AccesoContext.jsx
 *
 * Contexto de acceso simple: ¿la app está desbloqueada o no?
 * Reemplaza el RolContext anterior (que manejaba roles dueno/empleado).
 *
 * Provee:
 *   desbloqueado  → true si ya ingresó el PIN (o no hay PIN)
 *   hayPin        → true si hay un PIN configurado
 *   cargando      → true mientras verifica la configuración inicial
 *   desbloquear   → llama después de verificar el PIN correctamente
 *   bloquear      → cierra la sesión (vuelve a pedir PIN)
 *   recargarPin   → re-verifica si hay PIN (útil tras guardarlo en config)
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { hayPinConfigurado } from '@/services/pin'

const AccesoContext = createContext(null)

export function AccesoProvider({ children }) {
  const [desbloqueado, setDesbloqueado] = useState(false)
  const [hayPin,       setHayPin]       = useState(false)
  const [cargando,     setCargando]     = useState(true)

  const verificarConfig = useCallback(async () => {
    const tiene = await hayPinConfigurado()
    setHayPin(tiene)
    if (!tiene) setDesbloqueado(true)   // sin PIN → acceso libre
    else        setDesbloqueado(false)  // hay PIN → pedir al abrir
    setCargando(false)
  }, [])

  useEffect(() => { verificarConfig() }, [verificarConfig])

  function desbloquear()  { setDesbloqueado(true) }
  function bloquear()     { setDesbloqueado(false) }

  // Llamar desde Configuración al guardar/borrar el PIN
  async function recargarPin() {
    const tiene = await hayPinConfigurado()
    setHayPin(tiene)
    if (!tiene) setDesbloqueado(true)
  }

  return (
    <AccesoContext.Provider value={{ desbloqueado, hayPin, cargando, desbloquear, bloquear, recargarPin }}>
      {children}
    </AccesoContext.Provider>
  )
}

export function useAcceso() {
  const ctx = useContext(AccesoContext)
  if (!ctx) throw new Error('useAcceso debe usarse dentro de <AccesoProvider>')
  return ctx
}
