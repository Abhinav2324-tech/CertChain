import { motion } from 'framer-motion'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { verifyCertificate, verifyCertificateFile } from '../api/certificate'
import { Badge } from '../components/ui/Badge'
import { GlassCard } from '../components/ui/GlassCard'
import { Loader } from '../components/ui/Loader'

const statusColor = {
  valid: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
  tampered: 'text-red-300 bg-red-500/15 border-red-400/30',
  revoked: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
}

export default function VerifyPage() {
  const navigate = useNavigate()
  const { certificate_id } = useParams()
  const [certificateInput, setCertificateInput] = useState(certificate_id || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileCheckLoading, setFileCheckLoading] = useState(false)
  const [fileCheckResult, setFileCheckResult] = useState(null)

  useEffect(() => {
    const runVerification = async () => {
      if (!certificate_id) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      setFileCheckResult(null)
      try {
        const data = await verifyCertificate(certificate_id)
        setResult(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    runVerification()
  }, [certificate_id])

  const statusClass = useMemo(
    () => statusColor[result?.status] || 'text-slate-200 bg-white/10 border-white/20',
    [result?.status],
  )

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-3xl">
      <GlassCard className="p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Certificate Verification</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="field-input max-w-sm"
            value={certificateInput}
            onChange={(e) => setCertificateInput(e.target.value)}
            placeholder="Enter certificate ID"
          />
          <button type="button" className="gradient-btn" onClick={() => navigate(`/verify/${certificateInput}`)}>
            Verify
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-300">Certificate ID: {certificate_id || 'N/A'}</p>

        {loading && certificate_id && <Loader label="Verifying certificate..." />}
        {!loading && error && <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

        {!loading && result && certificate_id && (
          <div className="mt-4 space-y-4">
            <div className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold uppercase ${statusClass}`}>
              {result.status === 'valid' ? 'VALID' : result.status === 'tampered' ? 'TAMPERED' : 'REVOKED'}
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-300/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
              <ShieldCheck size={16} /> Blockchain verified
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
                <p>Student: {result.student_name}</p>
                <p>Roll Number: {result.roll_number}</p>
                <p>University: {result.university}</p>
                <p>Semester: {result.semester}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
                <p>Document Type: {result.document_type}</p>
                <p>Department: {result.department || 'N/A'}</p>
                <p>Specialization: {result.specialization || 'N/A'}</p>
                <p>SGPA: {result.sgpa}</p>
                <p className="mb-2">Authenticity Score: {result.authenticity_score}%</p>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" style={{ width: `${result.authenticity_score}%` }} />
                </div>
                <p>Certificate: {result.certificate_id}</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              <p className="mb-2 font-medium">Official Subject-Wise Record</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-white/10 text-slate-300">
                    <tr>
                      <th className="py-2 pr-3">Code</th>
                      <th className="py-2 pr-3">Title</th>
                      <th className="py-2 pr-3">Credits</th>
                      <th className="py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.subjects || []).map((sub) => (
                      <tr key={`${sub.subject_code}-${sub.grade}`} className="border-b border-white/5">
                        <td className="py-2 pr-3">{sub.subject_code}</td>
                        <td className="py-2 pr-3">{sub.subject_name}</td>
                        <td className="py-2 pr-3">{sub.credits}</td>
                        <td className="py-2">{sub.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm space-y-3">
              <p className="font-medium">Uploaded Certificate File Integrity Check</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="field-input max-w-md"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className="gradient-btn"
                  disabled={!selectedFile || fileCheckLoading}
                  onClick={async () => {
                    if (!selectedFile) return
                    setFileCheckLoading(true)
                    try {
                      const data = await verifyCertificateFile(certificate_id, selectedFile)
                      setFileCheckResult(data)
                    } catch (err) {
                      setFileCheckResult({ status: 'error', detail: err.message })
                    } finally {
                      setFileCheckLoading(false)
                    }
                  }}
                >
                  {fileCheckLoading ? 'Checking...' : 'Check Uploaded File'}
                </button>
              </div>
              {fileCheckResult && (
                <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                  {fileCheckResult.status === 'error' ? (
                    <p className="text-red-300">{fileCheckResult.detail}</p>
                  ) : (
                    <>
                      <p>
                        Result:{' '}
                        <span className={fileCheckResult.matches_trusted_pdf ? 'text-emerald-300' : 'text-red-300'}>
                          {fileCheckResult.matches_trusted_pdf ? 'MATCHED (authentic file)' : 'MISMATCH (tampered file)'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 break-all">Uploaded SHA256: {fileCheckResult.uploaded_sha256}</p>
                      <p className="text-xs text-slate-400 break-all">Trusted SHA256: {fileCheckResult.trusted_sha256}</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              <p className="mb-2 font-medium">Verification Summary</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300" />
                <Badge status={result.status} label={result.status} />
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.section>
  )
}
