import { Moon, Sun, UserCircle2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function Topbar({ children }) {
  const { darkMode, toggleDarkMode, role, user } = useAppStore()

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {children}
          <p className="text-sm text-slate-300">{role ? `${role} workspace` : 'Public workspace'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleDarkMode} className="rounded-xl p-2 hover:bg-white/10">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-1.5 text-sm">
            <UserCircle2 size={16} />
            <span>{user?.name || user?.email || 'Guest'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
