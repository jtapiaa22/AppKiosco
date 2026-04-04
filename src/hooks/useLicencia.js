import { useState, useEffect } from 'react'
import { checkLicense, activateLicense } from '@/services/license'

export function useLicencia() {
  const [estado, setEstado] = useState('verificando') // 'verificando' | 'valida' | 'invalida' | 'offline' | 'sin_key'
  const [info, setInfo]     = useState(null)
  const [activando, setActivando] = useState(false)
  const [errorActivacion, setErrorActivacion] = useState('')

  useEffect(() => {
    verificar()
  }, [])

  async function verificar() {
    setEstado('verificando')
    const res = await checkLicense()

    if (res.dev) {
      // Modo desarrollo sin Electron — pasar directo
      setEstado('valida')
      return
    }

    if (res.valid && res.offline) {
      setEstado('offline')
      setInfo({ diasRestantes: res.daysLeft, ...res.info })
    } else if (res.valid) {
      setEstado('valida')
      setInfo(res.info)
    } else if (res.reason === 'no_key') {
      setEstado('sin_key')
    } else {
      setEstado('invalida')
      setInfo({ reason: res.reason })
    }
  }

  async function activar(clave) {
    if (!clave.trim()) {
      setErrorActivacion('Ingresá una clave de licencia')
      return false
    }
    setActivando(true)
    setErrorActivacion('')
    const res = await activateLicense(clave.trim())
    setActivando(false)

    if (res.valid) {
      setEstado('valida')
      setInfo(res.info)
      return true
    } else {
      const mensajes = {
        rejected:        'La clave no es válida',
        expired:         'La licencia venció. Renovála para continuar.',
        no_electron:     'Error interno — reiniciá la aplicación',
        expired_offline: 'Sin conexión y período de gracia vencido',
      }
      setErrorActivacion(mensajes[res.reason] || 'Clave inválida. Verificá e intentá de nuevo.')
      return false
    }
  }

  return { estado, info, activando, errorActivacion, activar, verificar }
}