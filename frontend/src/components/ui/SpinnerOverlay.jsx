export function SpinnerOverlay({ show = false, label = 'Processing...' }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
      <div className="glass-card flex items-center gap-3 px-5 py-4">
        <div className="size-5 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  )
}
