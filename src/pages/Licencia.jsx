import { useLicencia } from '@/hooks/useLicencia'
import PantallaActivacion from '@/components/licencia/PantallaActivacion'
import PantallaOffline from '@/components/licencia/PantallaOffline'

// Esta página se usa como pantalla bloqueante antes de entrar a la app
// Se muestra solo si la licencia no está validada
export default function Licencia() {
  const { estado, info, activando, errorActivacion, activar, verificar } = useLicencia()

  if (estado === 'verificando') {
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
        onContinuar={() => window.location.hash = '/pos'}
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

  // Estado 'valida' — redirigir al POS
  window.location.hash = '/pos'
  return null
}