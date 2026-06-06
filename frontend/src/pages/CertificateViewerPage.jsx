import { motion } from 'framer-motion'
import { Download, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getDownloadUrl } from '../api/certificate'
import { GlassCard } from '../components/ui/GlassCard'

export default function CertificateViewerPage() {
  const { certificateId } = useParams()
  const downloadUrl = useMemo(() => getDownloadUrl(certificateId), [certificateId])

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-4">
      <GlassCard className="space-y-4 p-6">
        <h2 className="text-2xl font-semibold">Certificate Viewer</h2>
        <p className="text-sm text-slate-300">Certificate ID: {certificateId}</p>
        <p className="text-sm text-slate-300">
          Open downloadable PDF or verify publicly against blockchain checksum.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={downloadUrl} target="_blank" rel="noreferrer" className="gradient-btn">
            <Download size={16} /> Download PDF
          </a>
          <a href={`/verify/${certificateId}`} className="gradient-btn">
            <ExternalLink size={16} /> Verify Certificate
          </a>
        </div>
      </GlassCard>
    </motion.section>
  )
}
