import { AnimatePresence, motion } from 'framer-motion'
import {
  Blocks,
  FileText,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

const navByRole = {
  STUDENT: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/certificates', label: 'My Certificates', icon: FileText },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: ShieldCheck },
    { to: '/admin/issue', label: 'Issue Certificate', icon: FileText },
    { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
  ],
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { role, clearAuth } = useAppStore()
  const navItems = role ? navByRole[role] || [] : []

  const content = (
    <div className="flex h-full flex-col border-r border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold">
          <Blocks size={20} className="text-blue-300" />
          CertChain
        </NavLink>
        <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-1 hover:bg-white/10 lg:hidden">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={`${item.label}-${item.to}`}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                isActive ? 'bg-blue-500/20 text-white' : 'text-slate-300 hover:bg-white/10'
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <button
        type="button"
        onClick={clearAuth}
        className="mt-auto inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">{content}</aside>
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-slate-950/55" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              className="absolute inset-y-0 left-0 w-72"
            >
              {content}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
