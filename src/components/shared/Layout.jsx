import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useLicencia }  from '@/hooks/useLicencia'
import BadgeLicencia    from '@/components/licencia/BadgeLicencia'
import { useRol }       from '@/context/RolContext'
import { tienePermiso } from '@/services/pin'

const LINKS = [
  { to: '/pos',      label: 'Venta',    emoji: '🛒' },
  { to: '/caja',     label: 'Caja',     emoji: '💰' },
  { to: '/stock',    label: 'Stock',    emoji: '📦' },
  { to: '/fiados',   label: 'Fiados',   emoji: '📝' },
  { to: '/reportes', label: 'Reportes', emoji: '📊' },
]

export default function Layout() {
  const { estado, info }              = useLicencia()
  const { rol, cerrarSesion, hayPin, cargando } = useRol()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirigir si el rol no tiene permiso para la ruta actual
  useEffect(() => {
    if (!cargando && hayPin && rol && rol !== 'libre' && !tienePermiso(rol, location.pathname)) {
      navigate('/pos', { replace: true })
    }
  }, [rol, location.pathname, hayPin, cargando])

  // Mientras carga o sin PIN → mostrar todos los links
  // Con rol definido → filtrar según permisos
  const rolEfectivo = (!cargando && rol && rol !== 'libre') ? rol : null
  const linksVisibles = rolEfectivo
    ? LINKS.filter(l => tienePermiso(rolEfectivo, l.to))
    : LINKS

  const puedeVerConfig = !rolEfectivo || tienePermiso(rolEfectivo, '/configuracion')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏪</span>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">KioscoApp</h1>
              <BadgeLicencia estado={estado} info={info} />
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 p-3 space-y-0.5">
          {linksVisibles.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive
                   ? 'bg-sky-600 text-white'
                   : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }>
              <span className="text-base">{l.emoji}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-3 pb-2 border-t border-gray-800 pt-2 space-y-0.5">

          {/* Configuración → solo dueño/libre, oculta para empleado */}
          {puedeVerConfig && (
            <NavLink to="/configuracion"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive
                   ? 'bg-sky-600 text-white'
                   : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }>
              <span className="text-base">⚙️</span>
              Configuración
            </NavLink>
          )}

          {/* Chip de rol + cerrar sesión (solo cuando hay PIN activo) */}
          {hayPin && rol && rol !== 'libre' && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                rol === 'dueno'
                  ? 'bg-amber-900/40 text-amber-400'
                  : 'bg-blue-900/40 text-blue-400'
              }`}>
                {rol === 'dueno' ? '👑 Dueño' : '👷 Empleado'}
              </span>
              <button
                onClick={cerrarSesion}
                title="Cambiar usuario"
                className="text-gray-600 hover:text-gray-300 text-xs transition-colors"
              >
                🔓
              </button>
            </div>
          )}

          <p className="text-xs text-gray-700 font-mono px-3 pt-1">v1.0.0</p>
        </div>

      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
