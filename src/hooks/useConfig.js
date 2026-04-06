/**
 * src/hooks/useConfig.js
 *
 * Hook React para acceder a la configuración del kiosco.
 * Devuelve { config, loading, guardar, refetch }
 *
 * Uso:
 *   const { config, loading, guardar } = useConfig()
 *   guardar({ kiosco_nombre: 'Nuevo nombre' })
 */

import { useState, useEffect, useCallback } from 'react'
import { getConfig, setConfig } from '@/services/configuracion'

export function useConfig() {
  const [config,  setConfigState] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving,  setSaving]      = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getConfig()
      setConfigState(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const guardar = useCallback(async (cambios) => {
    setSaving(true)
    try {
      const res = await setConfig(cambios)
      if (res.ok) {
        // Actualizar estado local sin ir a DB
        setConfigState(prev => ({ ...prev, ...cambios }))
      }
      return res
    } finally {
      setSaving(false)
    }
  }, [])

  return { config, loading, saving, guardar, refetch }
}
