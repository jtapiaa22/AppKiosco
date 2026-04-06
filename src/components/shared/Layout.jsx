import { Outlet, NavLink } from 'react-router-dom'
import { useLicencia }  from '@/hooks/useLicencia'
import BadgeLicencia    from '@/components/licencia/BadgeLicencia'
import { useAcceso }    from '@/context/AccesoContext'

const LINKS = [
  { to: '/pos',      label: 'Venta',        emoji: '🛒' },
  { to: '/caja',     label: 'Caja',         emoji: '💰' },
  { to: '/stock',    label: 'Stock',        emoji: '📦' },
  { to: '/fiados',   label: 'Fiados',       emoji: '📝' },
  { to: '/reportes', label: 'Reportes',     emoji: '📊' },
  { to: '/clientes', label: 'Clientes',     emoji: '👥' },
]

export default function Layout() {
  const { estado, info } = useLicencia()
  const { hayPin, bloquear } = useAcceso()

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

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-0.5">
          {LINKS.map(l => (
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

        {/* Footer */}
        <div className="px-3 pb-2 border-t border-gray-800 pt-2 space-y-0.5">
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

          {/* Botón bloquear: solo si hay PIN configurado */}
          {hayPin && (
            <button
              onClick={bloquear}
              title="Bloquear app"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                         font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300
                         transition-all"
            >
              <span className="text-base">🔒</span>
              Bloquear
            </button>
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
