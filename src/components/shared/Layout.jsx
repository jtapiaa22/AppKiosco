import { Outlet, NavLink } from 'react-router-dom'
import { useLicencia } from '@/hooks/useLicencia'
import BadgeLicencia from '@/components/licencia/BadgeLicencia'

const links = [
  { to: '/pos',           label: 'Venta',          emoji: '🛒' },
  { to: '/caja',          label: 'Caja',           emoji: '💰' },
  { to: '/stock',         label: 'Stock',          emoji: '📦' },
  { to: '/fiados',        label: 'Fiados',         emoji: '📝' },
  { to: '/reportes',      label: 'Reportes',       emoji: '📊' },
  { to: '/configuracion', label: 'Configuración',  emoji: '⚙️' },
]

export default function Layout() {
  const { estado, info } = useLicencia()

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
          {links.slice(0, 5).map(l => (
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

        {/* Configuración al fondo del sidebar */}
        <div className="px-3 pb-2 border-t border-gray-800 pt-2">
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
          <p className="text-xs text-gray-700 font-mono px-3 pt-2">v1.0.0</p>
        </div>

      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
