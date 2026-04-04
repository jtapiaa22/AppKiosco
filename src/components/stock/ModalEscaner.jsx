/**
 * ModalEscaner.jsx
 * - El QR apunta a ngrok (para que el celu acceda desde cualquier red)
 * - El POLLING siempre usa localhost:3001 (la app corre en la misma PC, no necesita ngrok)
 */
import { useState, useEffect, useRef } from 'react'

const isElectron = () => typeof window !== 'undefined' && Boolean(window.electronAPI)

async function resolveQrUrl() {
  if (isElectron()) {
    const url    = await window.electronAPI.getApiUrl()
    const status = await window.electronAPI.getNgrokStatus()
    return { qrUrl: url, ngrok: status.activo }
  }
  const host = window.location.hostname || 'localhost'
  return { qrUrl: `http://${host}:3001/escaner`, ngrok: false }
}

const POLLING_BASE = 'http://localhost:3001'

function QRImage({ url }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
      alt="QR escaner"
      width={200}
      height={200}
      className="rounded-2xl border border-gray-700"
    />
  )
}

export default function ModalEscaner({
  onCodigo,
  onCerrar,
  titulo      = '📷 Escanear producto',
  descripcion = 'Abrí la URL en el celular y escaneá el código de barras.',
  textoRecibido = 'Abriendo formulario...',
}) {
  const [escanerUrl, setEscanerUrl]       = useState('')
  const [ngrokActivo, setNgrokActivo]     = useState(false)
  const [estado, setEstado]               = useState('cargando')
  const [codigoRecibido, setCodigoRecibido] = useState('')
  const pollingRef = useRef(null)

  useEffect(() => {
    init()
    return () => detener()
  }, [])

  async function init() {
    try {
      const { qrUrl, ngrok } = await resolveQrUrl()
      setNgrokActivo(ngrok)
      setEscanerUrl(qrUrl)
      await fetch(`${POLLING_BASE}/api/scan/pending`, { method: 'DELETE' }).catch(() => {})
      setEstado('esperando')
      pollingRef.current = setInterval(async () => {
        try {
          const res  = await fetch(`${POLLING_BASE}/api/scan/pending`)
          if (!res.ok) return
          const data = await res.json()
          if (data.pending && data.codigo) {
            detener()
            setCodigoRecibido(data.codigo)
            setEstado('recibido')
            // Pequeña pausa para mostrar el tick verde, luego dispara onCodigo
            // onCodigo es responsable de cerrar el modal (setModalEscaner(null))
            setTimeout(() => onCodigo(data.codigo), 600)
          }
        } catch (err) {
          console.warn('[ModalEscaner] polling error:', err)
        }
      }, 1000)
    } catch (err) {
      console.error('[ModalEscaner] init error:', err)
      setEstado('error')
    }
  }

  function detener() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
  }

  function handleCerrar() {
    detener()
    fetch(`${POLLING_BASE}/api/scan/pending`, { method: 'DELETE' }).catch(() => {})
    onCerrar()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-bold text-white text-base">{titulo}</h2>
          <button onClick={handleCerrar}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white
                       flex items-center justify-center transition-colors text-sm">
            ✕
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col items-center gap-4">

          {estado === 'cargando' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Obteniendo URL...</p>
            </div>
          )}

          {estado === 'error' && (
            <div className="text-center py-6">
              <p className="text-red-400 text-sm">No se pudo iniciar el escáner.</p>
              <p className="text-gray-500 text-xs mt-1">Verificá que la app esté corriendo en modo Electron.</p>
            </div>
          )}

          {estado === 'esperando' && escanerUrl && (
            <>
              <p className="text-gray-400 text-sm text-center">
                {descripcion}
              </p>

              <QRImage url={`${escanerUrl}?mode=pc`} />

              {!ngrokActivo && (
                <code className="text-xs text-violet-300 bg-gray-800 px-3 py-2 rounded-xl break-all text-center w-full">
                  {escanerUrl}?mode=pc
                </code>
              )}

              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse block" />
                <p className="text-amber-300 text-xs">Esperando escaneo...</p>
              </div>
            </>
          )}

          {estado === 'recibido' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-emerald-300 font-semibold text-sm">¡Código recibido!</p>
              <code className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg font-mono">{codigoRecibido}</code>
              <p className="text-gray-500 text-xs">{textoRecibido}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
