export function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-slate-300">
      <div className="size-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
