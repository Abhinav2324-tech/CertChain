import { motion } from 'framer-motion'
import { Copy, Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getDownloadUrl } from '../api/certificate'
import { GradientButton } from './ui/GradientButton'
import { GlassCard } from './ui/GlassCard'

export default function CertificateCard({ certificate }) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <GlassCard className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">{certificate.document_type || 'Certificate'}</p>
            <h3 className="mt-1 text-lg font-semibold">{certificate.certificate_id}</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(certificate.certificate_id)
              toast.success('Certificate ID copied')
            }}
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <Copy size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <p>Semester: {certificate.semester}</p>
          <p>SGPA: {certificate.sgpa ?? 'N/A'}</p>
          <p>Status: {certificate.status}</p>
          <p>Dept: {certificate.department || 'N/A'}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/certificate/${certificate.certificate_id}`} className="gradient-btn">
            <Eye size={16} /> View
          </Link>
          <a href={getDownloadUrl(certificate.certificate_id)} target="_blank" rel="noreferrer" className="gradient-btn">
            <Download size={16} /> Download
          </a>
          <GradientButton onClick={() => toast.success('Use Verify page for blockchain integrity check')}>
            Verify
          </GradientButton>
        </div>
      </GlassCard>
    </motion.div>
  )
}
