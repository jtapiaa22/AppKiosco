/**
 * SeccionPin.jsx
 *
 * Sección en Configuración para gestionar el PIN único de acceso a la app.
 * Un solo PIN: quien lo sabe, entra con acceso total.
 */

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { hayPinConfigurado, setPin } from '@/services/pin'
import { useAcceso } from '@/context/AccesoContext'

function InputPin({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={6}
        className="w-full px-3 py-2 pr-16 rounded-xl bg-gray-800 border border-gray-700
                   text-white text-sm placeholder:text-gray-600
                   focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40
                   tracking-[0.3em] transition-all"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
        tabIndex={-1}
      >
        {visible ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  )
}

export default function SeccionPin() {
  const { recargarPin } = useAcceso()

  const [tienePin,   setTienePin]   = useState(false)
  const [pinNuevo,   setPinNuevo]   = useState('')
  const [guardando,  setGuardando]  = useState(false)

  useEffect(() => {
    hayPinConfigurado().then(setTienePin)
  }, [])

  async function guardar() {
    if (pinNuevo && pinNuevo.length < 4) {
      toast.error('El PIN debe tener al menos 4 dígitos')
      return
    }
    setGuardando(true)
    const res = await setPin(pinNuevo)
    setGuardando(false)

    if (res?.ok !== false) {
      toast.success(pinNuevo ? 'PIN actualizado' : 'PIN eliminado')
      setTienePin(Boolean(pinNuevo))
      setPinNuevo('')
      await recargarPin()
    } else {
      toast.error('Error al guardar el PIN')
    }
  }

  async function eliminar() {
    setGuardando(true)
    await setPin('')
    setGuardando(false)
    toast.success('PIN eliminado')
    setTienePin(false)
    setPinNuevo('')
    await recargarPin()
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-white text-sm">🔐 PIN de acceso</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Si configurás un PIN, la app lo pedirá al abrirse. Quien lo ingrese tendrá acceso total.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Estado actual</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          tienePin
            ? 'bg-green-900/40 text-green-400'
            : 'bg-gray-800 text-gray-500'
        }`}>
          {tienePin ? '• PIN configurado' : 'Sin PIN (acceso libre)'}
        </span>
      </div>

      <InputPin
        value={pinNuevo}
        onChange={setPinNuevo}
        placeholder={tienePin ? 'Nuevo PIN (4–6 dígitos)' : 'Crear PIN (4–6 dígitos)'}
      />

      <div className="flex gap-2">
        <button
          onClick={guardar}
          disabled={guardando || !pinNuevo}
          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500
                     text-white transition-all active:scale-95 disabled:opacity-30"
        >
          {guardando ? 'Guardando...' : tienePin ? 'Cambiar PIN' : 'Crear PIN'}
        </button>

        {tienePin && (
          <button
            onClick={eliminar}
            disabled={guardando}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-900/40 hover:bg-red-900/60
                       text-red-400 transition-all active:scale-95 disabled:opacity-30"
          >
            Eliminar
          </button>
        )}
      </div>
    </section>
  )
}
