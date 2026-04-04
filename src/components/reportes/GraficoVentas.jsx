export default function GraficoVentas({ ventasPorDia }) {
  if (!ventasPorDia || ventasPorDia.length === 0) {
    return (
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Ventas por día</p>
        <div className="flex items-center justify-center h-32 opacity-30">
          <p className="text-gray-500 text-sm">Sin ventas en el período</p>
        </div>
      </div>
    )
  }

  const maxTotal = Math.max(...ventasPorDia.map(d => d.total))
  const BAR_W = Math.max(20, Math.min(48, Math.floor(540 / ventasPorDia.length) - 8))
  const CHART_H = 120
  const CHART_W = 580

  function formatFecha(str) {
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Ventas por día</p>
      <div className="overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H + 40}`} className="min-w-[300px]">
          {ventasPorDia.map((d, i) => {
            const barH = maxTotal > 0 ? Math.max(4, (d.total / maxTotal) * CHART_H) : 4
            const x = (CHART_W / ventasPorDia.length) * i + (CHART_W / ventasPorDia.length - BAR_W) / 2
            const y = CHART_H - barH

            return (
              <g key={d.fecha}>
                {/* Barra */}
                <rect
                  x={x} y={y}
                  width={BAR_W} height={barH}
                  rx="4"
                  fill="#0ea5e9"
                  opacity="0.8"
                />
                {/* Valor encima */}
                {barH > 20 && (
                  <text
                    x={x + BAR_W / 2} y={y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#9ca3af"
                  >
                    ${(d.total / 1000).toFixed(0)}k
                  </text>
                )}
                {/* Fecha abajo */}
                <text
                  x={x + BAR_W / 2} y={CHART_H + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#6b7280"
                >
                  {formatFecha(d.fecha)}
                </text>
                {/* Cant ventas */}
                <text
                  x={x + BAR_W / 2} y={CHART_H + 30}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#4b5563"
                >
                  {d.cant}v
                </text>
              </g>
            )
          })}
          {/* Línea base */}
          <line x1="0" y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke="#374151" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  )
}