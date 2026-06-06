import { Home, ShieldCheck, UserCircle2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Student', icon: UserCircle2 },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
]

export default function Sidebar() {
  return (
    <aside className="glass-card h-fit w-full space-y-2 p-3 lg:w-56">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
              isActive ? 'bg-blue-500/30 text-white' : 'text-slate-300 hover:bg-white/10'
            }`
          }
        >
          <link.icon size={16} />
          {link.label}
        </NavLink>
      ))}
    </aside>
  )
}
