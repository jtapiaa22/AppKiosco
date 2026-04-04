import { useState } from 'react'

export default function PantallaActivacion({ onActivar, activando, error, modo = 'sin_key' }) {
  const [clave, setClave] = useState('')

  const esVencida = modo === 'invalida'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo / marca */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-sky-600/20 border border-sky-500/30 mb-4">
            <span className="text-3xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">KioscoApp</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de gestión de kiosco</p>
        </div>

        {/* Card de activación */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">

          {esVencida ? (
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-bold text-white text-lg mb-1">Licencia vencida</h2>
              <p className="text-gray-400 text-sm">
                Tu suscripción venció. Ingresá una nueva clave para continuar usando KioscoApp.
              </p>
            </div>
          ) : (
            <div className="mb-5">
              <h2 className="font-bold text-white text-lg mb-1">Activar licencia</h2>
              <p className="text-gray-400 text-sm">
                Ingresá la clave que recibiste al suscribirte. Si no tenés una,
                contactá al vendedor para obtenerla.
              </p>
            </div>
          )}

          {/* Input de clave */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
                Clave de licencia
              </label>
              <input
                value={clave}
                onChange={e => setClave(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && onActivar(clave)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                           text-white font-mono text-center text-base tracking-widest
                           placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500
                           focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={() => onActivar(clave)}
              disabled={activando || !clave.trim()}
              className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white
                         font-bold text-base transition-all disabled:opacity-40
                         disabled:cursor-not-allowed active:scale-95"
            >
              {activando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : 'Activar'}
            </button>
          </div>

          {/* Ayuda */}
          <p className="text-center text-xs text-gray-600 mt-4">
            ¿Problemas con tu clave? Contactá a tu proveedor de KioscoApp.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 mt-6">
          KioscoApp · versión 1.0
        </p>
      </div>
    </div>
  )
}