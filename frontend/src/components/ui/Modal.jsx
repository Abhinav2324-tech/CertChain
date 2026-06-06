import { X } from 'lucide-react'
import { GlassCard } from './GlassCard'

export function Modal({ title, open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur">
      <div className="flex min-h-full items-start justify-center py-6">
        <GlassCard className="w-full max-w-xl max-h-[90vh] overflow-hidden p-6">
          <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-white/10">
            <X size={18} />
          </button>
          </div>
          <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto pr-1">
            {children}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
