function StatusBadge({ status }) {
  const config = {
    'en stock':    { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'En stock' },
    'stock faible':{ dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Stock faible' },
    'rupture':     { dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Rupture' },
  }[status] || { dot: 'bg-slate-400', text: 'text-[var(--fg-muted)]', bg: 'bg-[var(--bg-subtle)]', border: 'border-[var(--border)]', label: status }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.border} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}

export default StatusBadge
