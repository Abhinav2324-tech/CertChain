export function TextInput({ label, className = '', ...props }) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-sm text-slate-300">{label}</span>
      <input className="field-input" {...props} />
    </label>
  )
}
