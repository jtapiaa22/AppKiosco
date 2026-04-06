/**
 * Configuracion.jsx
 *
 * Página de configuración general de la app.
 * Secciones:
 *   1. Datos del negocio (nombre, teléfono, dirección)
 *   2. Preferencias de stock (umbral de alerta, venta sin stock)
 *   3. Preferencias de venta (moneda, monto inicial de caja)
 *   4. Backup de datos
 */

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useConfig } from '@/hooks/useConfig'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Sub-componente: campo de formulario
// ---------------------------------------------------------------------------
function Campo({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: input de texto
// ---------------------------------------------------------------------------
function Input({ value, onChange, placeholder, maxLength, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700
                 text-white text-sm placeholder:text-gray-600
                 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40
                 transition-all"
    />
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: toggle on/off
// ---------------------------------------------------------------------------
function Toggle({ value, onChange, label }) {
  const activo = value === '1' || value === true
  return (
    <button
      type="button"
      onClick={() => onChange(activo ? '0' : '1')}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${activo ? 'bg-sky-600' : 'bg-gray-700'}`}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                    ${activo ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Sub-componente: sección card
// ---------------------------------------------------------------------------
function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-white text-sm">{titulo}</h2>
        {descripcion && <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>}
      </div>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function Configuracion() {
  const { config, loading: loadingConfig, saving, guardar } = useConfig()

  // Estado local del formulario (se sincroniza con config cuando carga)
  const [form, setForm] = useState(null)

  // Backup
  const [backups,        setBackups]        = useState([])
  const [backupDir,      setBackupDir]      = useState('')
  const [loadingBackup,  setLoadingBackup]  = useState(true)
  const [haciendoBackup, setHaciendoBackup] = useState(false)

  // Sincronizar form cuando llega config de DB
  useEffect(() => {
    if (config && !form) setForm({ ...config })
  }, [config])

  // Cargar backups al montar
  useEffect(() => { cargarBackups() }, [])

  // -------------------------------------------------------------------------
  function setField(clave, valor) {
    setForm(prev => ({ ...prev, [clave]: valor }))
  }

  // -------------------------------------------------------------------------
  async function guardarSeccion(claves) {
    const cambios = Object.fromEntries(claves.map(k => [k, form[k]]))
    const res = await guardar(cambios)
    if (res.ok) toast.success('Guardado')
    else        toast.error('Error al guardar')
  }

  // -------------------------------------------------------------------------
  async function cargarBackups() {
    setLoadingBackup(true)
    try {
      if (!window.electronAPI?.backupList) { setBackups([]); return }
      const res = await window.electronAPI.backupList()
      if (res.ok) { setBackups(res.backups || []); setBackupDir(res.dir || '') }
    } catch (err) {
      console.error('[Configuracion] Error al listar backups:', err)
    } finally {
      setLoadingBackup(false)
    }
  }

  async function hacerBackupManual() {
    if (haciendoBackup) return
    setHaciendoBackup(true)
    const id = toast.loading('Creando backup...')
    try {
      const res = await window.electronAPI.backupRun()
      if (res.ok) { toast.success(`Backup creado: ${res.name}`, { id }); cargarBackups() }
      else          toast.error(`Error: ${res.error}`, { id })
    } catch { toast.error('No se pudo crear el backup', { id }) }
    finally    { setHaciendoBackup(false) }
  }

  // -------------------------------------------------------------------------
  // Skeleton de carga
  // -------------------------------------------------------------------------
  if (loadingConfig || !form) {
    return (
      <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="h-5 w-40 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="px-6 py-5 space-y-4 max-w-3xl">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="h-4 w-48 bg-gray-800 rounded animate-pulse" />
              <div className="h-9 bg-gray-800 rounded-xl animate-pulse" />
              <div className="h-9 bg-gray-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Render principal
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800
                      flex-shrink-0 sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold text-white">⚙️ Configuración</h1>
          <p className="text-xs text-gray-500 mt-0.5">Ajustes generales de KioscoApp</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5 max-w-3xl pb-10">

        {/* ── 1. Datos del negocio ─────────────────────── */}
        <Seccion
          titulo="🏪 Datos del negocio"
          descripcion="Aparece en los tickets y reportes impresos."
        >
          <div className="grid grid-cols-1 gap-3">
            <Campo label="Nombre del kiosco">
              <Input
                value={form.kiosco_nombre}
                onChange={v => setField('kiosco_nombre', v)}
                placeholder="Ej: Kiosco El Sol"
                maxLength={60}
              />
            </Campo>
            <Campo label="Teléfono" hint="Opcional">
              <Input
                value={form.kiosco_telefono}
                onChange={v => setField('kiosco_telefono', v)}
                placeholder="Ej: 3834-123456"
                maxLength={30}
              />
            </Campo>
            <Campo label="Dirección" hint="Opcional">
              <Input
                value={form.kiosco_direccion}
                onChange={v => setField('kiosco_direccion', v)}
                placeholder="Ej: San Martín 456, Catamarca"
                maxLength={80}
              />
            </Campo>
          </div>
          <BtnGuardar
            onClick={() => guardarSeccion(['kiosco_nombre','kiosco_telefono','kiosco_direccion'])}
            saving={saving}
          />
        </Seccion>

        {/* ── 2. Stock ──────────────────────────────────── */}
        <Seccion
          titulo="📦 Stock"
          descripcion="Comportamiento de alertas y ventas con stock bajo."
        >
          <div className="grid grid-cols-1 gap-3">
            <Campo
              label="Umbral de alerta de stock"
              hint="Se marca en rojo cuando el stock de un producto baja de este número."
            >
              <Input
                type="number"
                value={form.stock_umbral_alerta}
                onChange={v => setField('stock_umbral_alerta', v)}
                placeholder="5"
              />
            </Campo>
            <Campo label="Permitir vender sin stock">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-300">
                  {form.venta_permite_negativo === '1'
                    ? '✅ Habilitado — se puede vender aunque el stock llegue a 0'
                    : '❌ Deshabilitado — la venta se bloquea si no hay stock'}
                </span>
                <Toggle
                  value={form.venta_permite_negativo}
                  onChange={v => setField('venta_permite_negativo', v)}
                  label="Permitir venta sin stock"
                />
              </div>
            </Campo>
          </div>
          <BtnGuardar
            onClick={() => guardarSeccion(['stock_umbral_alerta','venta_permite_negativo'])}
            saving={saving}
          />
        </Seccion>

        {/* ── 3. Venta y caja ────────────────────────────── */}
        <Seccion
          titulo="💰 Venta y caja"
          descripcion="Moneda y valores por defecto al operar."
        >
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Símbolo de moneda" hint="Se muestra antes de los precios.">
              <Input
                value={form.moneda_simbolo}
                onChange={v => setField('moneda_simbolo', v)}
                placeholder="$"
                maxLength={5}
              />
            </Campo>
            <Campo label="Monto inicial de caja" hint="Sugerido al abrir turno.">
              <Input
                type="number"
                value={form.caja_monto_inicial}
                onChange={v => setField('caja_monto_inicial', v)}
                placeholder="0"
              />
            </Campo>
          </div>
          <BtnGuardar
            onClick={() => guardarSeccion(['moneda_simbolo','caja_monto_inicial'])}
            saving={saving}
          />
        </Seccion>

        {/* ── 4. Backup ──────────────────────────────────── */}
        <Seccion
          titulo="💾 Backup de datos"
          descripcion="Backup automático cada 24 hs. Se conservan los últimos 7."
        >
          <div className="flex items-center justify-between">
            {backupDir && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/60 rounded-xl flex-1 mr-3">
                <span className="text-gray-500 text-xs">📁</span>
                <span className="text-gray-300 text-xs font-mono truncate">{backupDir}</span>
              </div>
            )}
            <button
              onClick={hacerBackupManual}
              disabled={haciendoBackup}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500
                         text-white transition-all active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
            >
              {haciendoBackup
                ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
                : '⬆ Backup ahora'
              }
            </button>
          </div>

          {loadingBackup ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-6 text-gray-600 text-xs">
              <p className="text-xl mb-1">🗂</p>
              El primero se crea 30 segundos después de abrir la app.
            </div>
          ) : (
            <div className="space-y-1.5">
              {backups.map((b, i) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between px-3 py-2 rounded-xl
                             bg-gray-800/60 border border-gray-700/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{i === 0 ? '🟢' : '⚪'}</span>
                    <div>
                      <p className="text-xs font-mono text-gray-200">{b.name}</p>
                      <p className="text-xs text-gray-500">{formatFecha(b.mtime)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{formatSize(b.size)}</span>
                </div>
              ))}
            </div>
          )}
        </Seccion>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Botón guardar sección
// ---------------------------------------------------------------------------
function BtnGuardar({ onClick, saving }) {
  return (
    <div className="flex justify-end pt-1">
      <button
        onClick={onClick}
        disabled={saving}
        className="px-5 py-2 rounded-xl text-sm font-semibold bg-sky-600 hover:bg-sky-500
                   text-white transition-all active:scale-95
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {saving
          ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Guardando...</>
          : 'Guardar'
        }
      </button>
    </div>
  )
}
