import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import {
  getCertificateDetails,
  getDownloadUrl,
  tamperEditCertificate,
} from '../api/certificate'
import { Badge } from '../components/ui/Badge'
import { GlassCard } from '../components/ui/GlassCard'
import { Loader } from '../components/ui/Loader'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { getStudentCertificates } from '../api/student'
import { useAppStore } from '../store/useAppStore'
import { GRADES } from '../utils/constants'

export default function StudentDashboardPage() {
  const { user, certificates, setCertificates } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [semester, setSemester] = useState('')
  const [status, setStatus] = useState('')
  const [selectedCertificateId, setSelectedCertificateId] = useState('')
  const [certificateDetails, setCertificateDetails] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [savingTamper, setSavingTamper] = useState(false)

  useEffect(() => {
    const loadCertificates = async () => {
      setLoading(true)
      try {
        const data = await getStudentCertificates(user.id)
        setCertificates(data)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) loadCertificates()
  }, [user?.id, setCertificates])

  const filtered = certificates.filter((certificate) => {
    const byId = certificate.certificate_id.toLowerCase().includes(search.toLowerCase())
    const bySemester = semester ? String(certificate.semester) === semester : true
    const byStatus = status ? certificate.status === status : true
    return byId && bySemester && byStatus
  })

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <GlassCard className="p-5">
        <h2 className="text-2xl font-semibold">Welcome, {user?.name || 'Student'}</h2>
        <p className="text-sm text-slate-300">Role: STUDENT</p>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="field-input pl-9"
              placeholder="Search by certificate ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <input className="field-input" placeholder="Filter by semester" value={semester} onChange={(e) => setSemester(e.target.value)} />
          <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
            <option value="updated">Updated</option>
            <option value="tampered">Tampered</option>
          </select>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="grid gap-3 p-4 md:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-6 text-center text-slate-300">No certificates matched your filters.</GlassCard>
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-slate-300">
              <tr>
                <th className="px-4 py-3">Certificate ID</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">SGPA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((certificate) => (
                <tr key={certificate.certificate_id} className="border-b border-white/10">
                  <td className="px-4 py-3">{certificate.certificate_id}</td>
                  <td className="px-4 py-3">{certificate.semester}</td>
                  <td className="px-4 py-3">{certificate.sgpa ?? 'N/A'}</td>
                  <td className="px-4 py-3"><Badge status={certificate.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10"
                        onClick={async () => {
                          setSelectedCertificateId(certificate.certificate_id)
                          setViewLoading(true)
                          try {
                            const data = await getCertificateDetails(certificate.certificate_id)
                            setCertificateDetails(data)
                          } catch (error) {
                            toast.error(error.message)
                          } finally {
                            setViewLoading(false)
                          }
                        }}
                      >
                        View
                      </button>
                      <a className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10" href={getDownloadUrl(certificate.certificate_id)} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      <Modal
        open={Boolean(selectedCertificateId)}
        onClose={() => {
          setSelectedCertificateId('')
          setCertificateDetails(null)
        }}
        title={`View Certificate - ${selectedCertificateId}`}
      >
        {viewLoading || !certificateDetails ? (
          <Loader />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <p><span className="text-slate-400">Roll:</span> {certificateDetails.roll_number || 'N/A'}</p>
              <p><span className="text-slate-400">Semester:</span> {certificateDetails.semester}</p>
              <p><span className="text-slate-400">Document:</span> {certificateDetails.document_type}</p>
              <p><span className="text-slate-400">Status:</span> {certificateDetails.status}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tamper Simulation (Edit Grades)</p>
              <p className="text-xs text-slate-400">
                Change one or more grades and save. Verification will then show this certificate as tampered.
              </p>
              {certificateDetails.subjects?.map((subject, index) => (
                <div key={`${subject.subject_code}-${index}`} className="grid gap-2 sm:grid-cols-[1fr,1fr]">
                  <input
                    className="field-input"
                    value={`${subject.subject_code} - ${subject.subject_name}`}
                    disabled
                  />
                  <select
                    className="field-input"
                    value={subject.grade}
                    onChange={(e) =>
                      setCertificateDetails((prev) => ({
                        ...prev,
                        subjects: prev.subjects.map((row, i) =>
                          i === index ? { ...row, grade: e.target.value } : row,
                        ),
                      }))
                    }
                  >
                    {GRADES.map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="gradient-btn"
                disabled={savingTamper}
                onClick={async () => {
                  setSavingTamper(true)
                  try {
                    await tamperEditCertificate(
                      selectedCertificateId,
                      (certificateDetails.subjects || []).map((s) => ({
                        subject_code: s.subject_code,
                        grade: s.grade,
                      })),
                    )
                    const refreshed = await getStudentCertificates(user.id)
                    setCertificates(refreshed)
                    setCertificateDetails((prev) => ({ ...prev, status: 'tampered' }))
                    toast.success('Tamper simulation saved')
                  } catch (error) {
                    toast.error(error.message)
                  } finally {
                    setSavingTamper(false)
                  }
                }}
              >
                {savingTamper ? 'Saving...' : 'Save Grade Changes'}
              </button>
              <a href={getDownloadUrl(selectedCertificateId)} target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/10">
                Open PDF
              </a>
              <a href={`/verify/${selectedCertificateId}`} className="rounded-xl border border-white/15 px-3 py-2 hover:bg-white/10">
                Open Verify
              </a>
            </div>
          </div>
        )}
      </Modal>
    </motion.section>
  )
}
