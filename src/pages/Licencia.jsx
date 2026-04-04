import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLicencia } from '@/hooks/useLicencia'
import PantallaActivacion from '@/components/licencia/PantallaActivacion'
import PantallaOffline from '@/components/licencia/PantallaOffline'

export default function Licencia() {
  const { estado, info, activando, errorActivacion, activar, verificar } = useLicencia()
  const navigate = useNavigate()

  // Redirigir al POS una vez que la licencia es válida
  useEffect(() => {
    if (estado === 'valida') {
      navigate('/pos', { replace: true })
    }
  }, [estado, navigate])

  if (estado === 'verificando' || estado === 'valida') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                        bg-sky-600/20 border border-sky-500/30">
          <span className="text-3xl">🏪</span>
        </div>
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Verificando licencia...</p>
      </div>
    )
  }

  if (estado === 'offline') {
    return (
      <PantallaOffline
        info={info}
        onContinuar={() => navigate('/pos', { replace: true })}
        onReintentar={verificar}
      />
    )
  }

  if (estado === 'sin_key' || estado === 'invalida') {
    return (
      <PantallaActivacion
        modo={estado}
        onActivar={activar}
        activando={activando}
        error={errorActivacion}
      />
    )
  }

  return null
}
