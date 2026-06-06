import { motion } from 'framer-motion'
import { QrCode, ShieldCheck, ShieldEllipsis } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/ui/GlassCard'

const features = [
  { icon: ShieldCheck, title: 'Tamper-proof', desc: 'Certificate hashes secured using blockchain ledger integrity.' },
  { icon: QrCode, title: 'QR verification', desc: 'Public scan and verification endpoint for instant trust checks.' },
  { icon: ShieldEllipsis, title: 'Audit logs', desc: 'Transparent lifecycle logs for issue, update, revoke, and verify.' },
]

export default function LandingPage() {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-7xl space-y-10 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
        <p className="text-lg font-semibold">CertChain</p>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/verify/CERT-DEMO" className="rounded-xl px-3 py-2 hover:bg-white/10">Verify</Link>
          <Link to="/admin-login" className="rounded-xl px-3 py-2 hover:bg-white/10">Admin</Link>
          <Link to="/login" className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/10">Login</Link>
        </div>
      </div>
      <GlassCard className="overflow-hidden p-8 sm:p-12">
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
          <span className="rounded-full border border-blue-300/40 bg-blue-500/20 px-4 py-1 text-xs text-blue-200">
            Blockchain Secured Certificates
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            CertChain - Academic certificates with blockchain-grade trust
          </h1>
          <p className="max-w-2xl text-slate-300">
            A complete academic credential system for universities and students. Issue, verify, and monitor certificate integrity in real time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="gradient-btn">Student Login</Link>
            <Link to="/register" className="rounded-2xl border border-white/20 px-4 py-2.5 hover:bg-white/10">Student Register</Link>
            <Link to="/admin-login" className="rounded-2xl border border-white/20 px-4 py-2.5 hover:bg-white/10">Admin Login</Link>
            <Link to="/verify/CERT-DEMO" className="rounded-2xl border border-white/20 px-4 py-2.5 hover:bg-white/10">
              Verify Certificate
            </Link>
          </div>
        </motion.div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * idx }}
          >
            <GlassCard className="h-full p-5">
              <item.icon className="text-blue-300" />
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
