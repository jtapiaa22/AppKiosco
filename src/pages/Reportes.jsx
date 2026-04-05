import { useReportes } from '@/hooks/useReportes'
import TarjetasResumen from '@/components/reportes/TarjetasResumen'
import GraficoVentas from '@/components/reportes/GraficoVentas'
import TopProductos from '@/components/reportes/TopProductos'
import PanelAlertas from '@/components/reportes/PanelAlertas'
import TablaVentas from '@/components/reportes/TablaVentas'

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy' },
  { id: 'semana', label: '7 días' },
  { id: 'mes',    label: '30 días' },
]

export default function Reportes() {
  const { datos, cargando, periodo, setPeriodo, recargar } = useReportes()

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-y-auto">

      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0 sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold text-white">Reportes</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700">
            {PERIODOS.map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${periodo === p.id ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={recargar}
            className={`w-8 h-8 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700
                        text-gray-400 hover:text-white flex items-center justify-center transition-all
                        text-sm ${cargando ? 'animate-spin' : ''}`}>↻</button>
        </div>
      </div>

      {cargando && !datos ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-6 py-5 space-y-5">
          <TarjetasResumen resumen={datos?.resumen} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <GraficoVentas ventasPorDia={datos?.ventasPorDia} />
              <TopProductos productos={datos?.topProductos} />
              {/* Tabla de ventas del período seleccionado */}
              <TablaVentas periodo={periodo} />
            </div>
            <div>
              <PanelAlertas
                fiados={datos?.fiados}
                stockBajo={datos?.stockBajo}
                rentabilidad={datos?.rentabilidad}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
