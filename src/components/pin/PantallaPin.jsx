/**
 * PantallaPin.jsx
 *
 * Pantalla de ingreso de PIN al abrir la app.
 * Teclado numérico visual + soporte de teclado físico.
 * Máximo 6 dígitos.
 */

import { useState, useEffect, useCallback } from 'react'
import { verificarPin } from '@/services/pin'
import { useAcceso }    from '@/context/AccesoContext'

const MAX = 6

export default function PantallaPin() {
  const { desbloquear } = useAcceso()
  const [pin,      setPin]      = useState('')
  const [error,    setError]    = useState(false)
  const [shake,    setShake]    = useState(false)
  const [checking, setChecking] = useState(false)

  const agregarDigito = useCallback((d) => {
    if (checking) return
    setError(false)
    setPin(prev => {
      if (prev.length >= MAX) return prev
      const nuevo = prev + d
      if (nuevo.length === MAX) confirmarPin(nuevo)
      return nuevo
    })
  }, [checking])

  const borrar = useCallback(() => {
    setPin(p => p.slice(0, -1))
    setError(false)
  }, [])

  const confirmarPin = useCallback(async (value) => {
    if (checking) return
    setChecking(true)
    const ok = await verificarPin(value)
    setChecking(false)
    if (ok) {
      desbloquear()
    } else {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
    }
  }, [checking, desbloquear])

  const confirmar = useCallback(() => {
    if (pin.length > 0) confirmarPin(pin)
  }, [pin, confirmarPin])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key >= '0' && e.key <= '9') agregarDigito(e.key)
      if (e.key === 'Backspace')         borrar()
      if (e.key === 'Enter')             confirmar()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [agregarDigito, borrar, confirmar])

  const puntos = Array.from({ length: MAX }, (_, i) => i < pin.length)

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="text-center">
          <span className="text-4xl">🏪</span>
          <h1 className="text-white font-bold text-lg mt-2">KioscoApp</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresá tu PIN para continuar</p>
        </div>

        {/* Indicador de dígitos */}
        <div className={`flex gap-3 transition-transform ${shake ? 'animate-shake' : ''}`}>
          {puntos.map((lleno, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                ${ lleno
                  ? error ? 'border-red-500 bg-red-500' : 'border-sky-400 bg-sky-400'
                  : 'border-gray-600 bg-transparent'
                }`}
            />
          ))}
        </div>

        {/* Error */}
        <p className={`text-sm text-red-400 transition-opacity h-4 ${error ? 'opacity-100' : 'opacity-0'}`}>
          PIN incorrecto
        </p>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => {
            if (k === '') return <div key={i} />
            const esBorrar = k === '⌫'
            return (
              <button
                key={k}
                onClick={() => esBorrar ? borrar() : agregarDigito(k)}
                disabled={checking}
                className={`
                  h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95
                  disabled:opacity-40
                  ${ esBorrar
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600'
                  }
                `}
              >
                {k}
              </button>
            )
          })}
        </div>

        {/* Confirmar */}
        <button
          onClick={confirmar}
          disabled={pin.length === 0 || checking}
          className="w-full h-12 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white
                     font-semibold text-sm transition-all active:scale-95
                     disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {checking
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : 'Ingresar'
          }
        </button>

      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  )
}
