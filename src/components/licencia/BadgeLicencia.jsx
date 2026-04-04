// Badge pequeño para mostrar el estado de licencia en el sidebar o header
// offline con días restantes, o verde si está todo ok

export default function BadgeLicencia({ estado, info }) {
  if (estado === 'valida') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-xs text-emerald-400 font-mono">Activa</span>
      </div>
    )
  }

  if (estado === 'offline') {
    const critico = (info?.diasRestantes ?? 7) <= 2
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border
        ${critico
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-amber-500/10 border-amber-500/20'}`}>
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${critico ? 'bg-red-400' : 'bg-amber-400'}`} />
        <span className={`text-xs font-mono ${critico ? 'text-red-400' : 'text-amber-400'}`}>
          Offline · {info?.diasRestantes}d
        </span>
      </div>
    )
  }

  return null
}