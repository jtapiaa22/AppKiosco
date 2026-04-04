function Metrica({ label, valor, sub, color = 'white', prefijo = '$' }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${
        color === 'green'  ? 'text-emerald-400' :
        color === 'amber'  ? 'text-amber-400'   :
        color === 'red'    ? 'text-red-400'      :
        color === 'sky'    ? 'text-sky-400'      :
        color === 'violet' ? 'text-violet-400'   :
        'text-white'
      }`}>
        {prefijo}{typeof valor === 'number' ? valor.toLocaleString('es-AR') : valor}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function TarjetasResumen({ resumen }) {
  if (!resumen) return null

  const ticket = resumen.cant_ventas > 0
    ? (resumen.total_vendido / resumen.cant_ventas).toFixed(0)
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Metrica
        label="Total vendido"
        valor={resumen.total_vendido}
        sub={`${resumen.cant_ventas} ventas · ticket prom $${parseInt(ticket).toLocaleString('es-AR')}`}
        color="green"
      />
      <Metrica
        label="Efectivo"
        valor={resumen.total_efectivo}
        color="white"
      />
      <Metrica
        label="Transferencias"
        valor={resumen.total_transferencia}
        color="sky"
      />
      <Metrica
        label="Fiado (período)"
        valor={resumen.total_fiado}
        color="amber"
        sub="pendiente de cobro"
      />
    </div>
  )
}