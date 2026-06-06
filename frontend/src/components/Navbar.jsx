import { motion } from 'framer-motion'
import { Blocks, LayoutDashboard, SearchCheck, UserPlus } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Navbar() {
  const { studentId, universityId, clearAllSessions } = useAppStore()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <Blocks className="text-blue-300" size={20} />
          CertChain
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/verify/CERT-DEMO" className="rounded-xl px-3 py-2 text-sm hover:bg-white/10">
            <span className="inline-flex items-center gap-2"><SearchCheck size={16} /> Verify</span>
          </NavLink>
          <NavLink to={universityId ? '/admin' : '/admin-login'} className="rounded-xl px-3 py-2 text-sm hover:bg-white/10">
            <span className="inline-flex items-center gap-2"><LayoutDashboard size={16} /> Admin</span>
          </NavLink>
          {!studentId && !universityId && (
            <NavLink to="/register" className="rounded-xl px-3 py-2 text-sm hover:bg-white/10">
              <span className="inline-flex items-center gap-2"><UserPlus size={16} /> Register</span>
            </NavLink>
          )}
          {studentId || universityId ? (
            <button
              type="button"
              onClick={clearAllSessions}
              className="rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </motion.header>
  )
}
