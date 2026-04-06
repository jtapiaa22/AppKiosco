/**
 * src/context/RolContext.jsx
 *
 * Contexto global del rol autenticado en la sesión actual.
 * Se resetea al cerrar la app (en memoria, no persiste en DB).
 *
 * Provee:
 *   rol          → 'dueno' | 'empleado' | null
 *   hayPinActivo → true si hay al menos un PIN configurado
 *   setRol       → para actualizar tras autenticar
 *   cerrarSesion → vuelve a pedir PIN
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { getPinStatus } from '@/services/pin'

const RolContext = createContext(null)

export function RolProvider({ children }) {
  const [rol,          setRol]          = useState(null)   // null = no autenticado aun
  const [hayPin,       setHayPin]       = useState(false)  // hay al menos un PIN configurado
  const [cargando,     setCargando]     = useState(true)

  useEffect(() => {
    getPinStatus().then(({ tienePinDueno, tienePinEmpleado }) => {
      const activo = tienePinDueno || tienePinEmpleado
      setHayPin(activo)
      // Si no hay ningún PIN configurado → acceso libre total
      if (!activo) setRol('libre')
      setCargando(false)
    })
  }, [])

  function cerrarSesion() {
    setRol(null)
  }

  return (
    <RolContext.Provider value={{ rol, hayPin, setRol, cerrarSesion, cargando }}>
      {children}
    </RolContext.Provider>
  )
}

export function useRol() {
  const ctx = useContext(RolContext)
  if (!ctx) throw new Error('useRol debe usarse dentro de <RolProvider>')
  return ctx
}
