const styles = {
  valid: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  active: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  revoked: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  tampered: 'border-red-400/40 bg-red-500/15 text-red-200',
  updated: 'border-blue-400/40 bg-blue-500/15 text-blue-200',
}

export function Badge({ label = '', status = '' }) {
  const color = styles[String(status).toLowerCase()] || 'border-white/20 bg-white/10 text-slate-100'
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium uppercase ${color}`}>{label || status}</span>
}
