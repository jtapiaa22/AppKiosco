/**
 * SeccionPin.jsx
 *
 * Sección dentro de Configuración para gestionar los PINs.
 * Solo visible para el rol 'dueno'.
 *
 * Permite:
 *   - Configurar PIN del dueño
 *   - Configurar PIN del empleado
 *   - Borrar PIN (dejar campo vacío = deshabilitar)
 */

import { useState, useEffect } from 'react'
import toast  from 'react-hot-toast'
import { getPinStatus, setPin } from '@/services/pin'
import { useRol } from '@/context/RolContext'

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
        className="w-full px-3 py-2 pr-10 rounded-xl bg-gray-800 border border-gray-700
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
  const { rol } = useRol()

  const [status,       setStatus]       = useState({ tienePinDueno: false, tienePinEmpleado: false })
  const [pinDueno,     setPinDueno]     = useState('')
  const [pinEmpleado,  setPinEmpleado]  = useState('')
  const [guardando,    setGuardando]    = useState(null) // 'dueno' | 'empleado' | null

  useEffect(() => {
    getPinStatus().then(setStatus)
  }, [])

  async function guardarPinDueno() {
    if (pinDueno && pinDueno.length < 4) {
      toast.error('El PIN debe tener al menos 4 dígitos')
      return
    }
    setGuardando('dueno')
    const res = await setPin('dueno', pinDueno)
    setGuardando(null)
    if (res.ok) {
      toast.success(pinDueno ? 'PIN del dueño actualizado' : 'PIN del dueño eliminado')
      setStatus(s => ({ ...s, tienePinDueno: Boolean(pinDueno) }))
      setPinDueno('')
    } else {
      toast.error('Error al guardar PIN')
    }
  }

  async function guardarPinEmpleado() {
    if (pinEmpleado && pinEmpleado.length < 4) {
      toast.error('El PIN debe tener al menos 4 dígitos')
      return
    }
    setGuardando('empleado')
    const res = await setPin('empleado', pinEmpleado)
    setGuardando(null)
    if (res.ok) {
      toast.success(pinEmpleado ? 'PIN del empleado actualizado' : 'PIN del empleado eliminado')
      setStatus(s => ({ ...s, tienePinEmpleado: Boolean(pinEmpleado) }))
      setPinEmpleado('')
    } else {
      toast.error('Error al guardar PIN')
    }
  }

  // Solo el dueño puede ver esta sección
  if (rol === 'empleado') return null

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-white text-sm">🔐 PINs de acceso</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          El PIN se pide al abrir la app. Dueño tiene acceso total; empleado solo a Venta, Fiados y Clientes.
        </p>
      </div>

      {/* PIN Dueño */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">👑 PIN del dueño</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            status.tienePinDueno
              ? 'bg-green-900/40 text-green-400'
              : 'bg-gray-800 text-gray-500'
          }`}>
            {status.tienePinDueno ? '• Configurado' : 'Sin PIN'}
          </span>
        </div>
        <InputPin
          value={pinDueno}
          onChange={setPinDueno}
          placeholder={status.tienePinDueno ? 'Nuevo PIN (4–6 dígitos)' : 'Crear PIN (4–6 dígitos)'}
        />
        <div className="flex gap-2">
          <button
            onClick={guardarPinDueno}
            disabled={guardando === 'dueno' || (!pinDueno && !status.tienePinDueno)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500
                       text-white transition-all active:scale-95 disabled:opacity-30"
          >
            {guardando === 'dueno' ? 'Guardando...' : pinDueno ? 'Guardar PIN' : 'Actualizar'}
          </button>
          {status.tienePinDueno && (
            <button
              onClick={() => { setPinDueno(''); guardarPinDueno() }}
              disabled={guardando === 'dueno'}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-900/40 hover:bg-red-900/60
                         text-red-400 transition-all active:scale-95 disabled:opacity-30"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* PIN Empleado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">👷 PIN del empleado</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            status.tienePinEmpleado
              ? 'bg-blue-900/40 text-blue-400'
              : 'bg-gray-800 text-gray-500'
          }`}>
            {status.tienePinEmpleado ? '• Configurado' : 'Sin PIN'}
          </span>
        </div>
        <InputPin
          value={pinEmpleado}
          onChange={setPinEmpleado}
          placeholder={status.tienePinEmpleado ? 'Nuevo PIN (4–6 dígitos)' : 'Crear PIN (4–6 dígitos)'}
        />
        <p className="text-xs text-gray-600">
          Accede a: Venta, Fiados y Clientes. No ve Reportes, Caja ni Configuración.
        </p>
        <div className="flex gap-2">
          <button
            onClick={guardarPinEmpleado}
            disabled={guardando === 'empleado' || (!pinEmpleado && !status.tienePinEmpleado)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500
                       text-white transition-all active:scale-95 disabled:opacity-30"
          >
            {guardando === 'empleado' ? 'Guardando...' : pinEmpleado ? 'Guardar PIN' : 'Actualizar'}
          </button>
          {status.tienePinEmpleado && (
            <button
              onClick={() => { setPinEmpleado(''); guardarPinEmpleado() }}
              disabled={guardando === 'empleado'}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-900/40 hover:bg-red-900/60
                         text-red-400 transition-all active:scale-95 disabled:opacity-30"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
