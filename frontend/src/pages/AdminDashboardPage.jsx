import { motion } from 'framer-motion'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getCertificateDetails,
  getAuditLogs,
  issueCertificate,
  revokeCertificate,
  updateCertificate,
} from '../api/certificate'
import { getStudentByRoll, getStudentCertificates } from '../api/student'
import { getSubjectsBySemester } from '../api/subjects'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLocation } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { GradientButton } from '../components/ui/GradientButton'
import { GlassCard } from '../components/ui/GlassCard'
import { Modal } from '../components/ui/Modal'
import { SpinnerOverlay } from '../components/ui/SpinnerOverlay'
import { TextInput } from '../components/ui/TextInput'
import { GRADES } from '../utils/constants'
import { useAppStore } from '../store/useAppStore'

const emptySubject = { subject_code: '', grade: 'A' }
const makeSubjectRow = (subjectCode = '', grade = 'A') => ({
  row_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  subject_code: subjectCode,
  grade,
})

export default function AdminDashboardPage() {
  const location = useLocation()
  const { user } = useAppStore()
  const [issuing, setIssuing] = useState(false)
  const [fetchingIssued, setFetchingIssued] = useState(false)
  const [issuedCertificates, setIssuedCertificates] = useState([])
  const [semesterSubjects, setSemesterSubjects] = useState([])
  const [lookupRollNumber, setLookupRollNumber] = useState('')
  const [resolvedLookupRoll, setResolvedLookupRoll] = useState('')
  const [auditLookupId, setAuditLookupId] = useState('')
  const [updateOpen, setUpdateOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedUpdateCertificateId, setSelectedUpdateCertificateId] = useState('')
  const [updateSemesterSubjects, setUpdateSemesterSubjects] = useState([])
  const [updateForm, setUpdateForm] = useState({
    roll_number: '',
    university_id: '',
    document_type: '',
    semester: '',
    department: '',
    specialization: '',
    subjects: [makeSubjectRow()],
  })
  const [resultId, setResultId] = useState('')
  const [selectedCertificateId, setSelectedCertificateId] = useState('')
  const [auditTimeline, setAuditTimeline] = useState([])
  const [auditOpen, setAuditOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const issueSectionRef = useRef(null)
  const managementSectionRef = useRef(null)
  const [form, setForm] = useState({
    roll_number: '',
    university_id: user?.id ? String(user.id) : '',
    semester: '',
    document_type: 'GRADE_SHEET',
    subjects: [makeSubjectRow()],
  })

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      university_id: user?.id ? String(user.id) : '',
    }))
  }, [user?.id])

  useEffect(() => {
    const loadSubjects = async () => {
      if (!form.semester) return
      try {
        const data = await getSubjectsBySemester(form.semester)
        setSemesterSubjects(data)
      } catch {
        setSemesterSubjects([])
      }
    }
    loadSubjects()
  }, [form.semester])

  useEffect(() => {
    const loadUpdateSubjects = async () => {
      if (!updateOpen || !updateForm.semester) {
        setUpdateSemesterSubjects([])
        return
      }
      try {
        const data = await getSubjectsBySemester(updateForm.semester)
        setUpdateSemesterSubjects(data)
      } catch {
        setUpdateSemesterSubjects([])
      }
    }
    loadUpdateSubjects()
  }, [updateOpen, updateForm.semester])

  const updateSubject = (index, key, value) => {
    setForm((prev) => {
      const subjects = [...prev.subjects]
      subjects[index] = { ...subjects[index], [key]: value }
      return { ...prev, subjects }
    })
  }

  const addSubjectRow = () => setForm((prev) => ({ ...prev, subjects: [...prev.subjects, makeSubjectRow()] }))
  const removeSubjectRow = (index) =>
    setForm((prev) => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }))

  const handleIssue = async (event) => {
    event.preventDefault()
    setIssuing(true)
    try {
      const payload = {
        ...form,
        university_id: Number(form.university_id),
      }
      const data = await issueCertificate(payload)
      setResultId(data.certificate_id)
      toast.success(`Certificate issued: ${data.certificate_id}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIssuing(false)
    }
  }

  const handleLookup = async () => {
    if (!lookupRollNumber) {
      toast.error('Enter roll number')
      return
    }
    setFetchingIssued(true)
    try {
      const student = await getStudentByRoll(lookupRollNumber)
      const data = await getStudentCertificates(student.student_id)
      setIssuedCertificates(data)
      setResolvedLookupRoll(student.roll_number)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setFetchingIssued(false)
    }
  }

  const handleRevoke = async (certificateId) => {
    setBusy(true)
    try {
      await revokeCertificate(certificateId)
      toast.success('Certificate Revoked')
      setIssuedCertificates((prev) =>
        prev.map((item) =>
          item.certificate_id === certificateId ? { ...item, status: 'revoked' } : item,
        ),
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleAudit = async (certificateId) => {
    setBusy(true)
    try {
      const data = await getAuditLogs(certificateId)
      setSelectedCertificateId(certificateId)
      setAuditTimeline(data.logs || [])
      setAuditOpen(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleAuditLookup = async () => {
    if (!auditLookupId.trim()) {
      toast.error('Enter certificate ID')
      return
    }
    await handleAudit(auditLookupId.trim())
  }

  const updateUpdateSubject = (index, key, value) => {
    setUpdateForm((prev) => {
      const subjects = [...prev.subjects]
      subjects[index] = { ...subjects[index], [key]: value }
      return { ...prev, subjects }
    })
  }

  const addUpdateSubjectRow = () =>
    setUpdateForm((prev) => ({ ...prev, subjects: [...prev.subjects, makeSubjectRow()] }))

  const removeUpdateSubjectRow = (index) =>
    setUpdateForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }))

  const handleOpenUpdate = async (certificateId) => {
    setBusy(true)
    try {
      const data = await getCertificateDetails(certificateId)
      setSelectedUpdateCertificateId(certificateId)
      setUpdateForm({
        roll_number: data.roll_number || resolvedLookupRoll || '',
        university_id: String(data.university_id || user?.id || ''),
        document_type: data.document_type || '',
        semester: String(data.semester || ''),
        department: data.department || '',
        specialization: data.specialization || '',
        subjects: (data.subjects || []).length
          ? data.subjects.map((sub) => makeSubjectRow(sub.subject_code, sub.grade))
          : [makeSubjectRow()],
      })
      setUpdateOpen(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdateCertificate = async () => {
    if (!selectedUpdateCertificateId) return
    if (!updateForm.roll_number) {
      toast.error('Roll number is required')
      return
    }
    setUpdating(true)
    try {
      const payload = {
        roll_number: updateForm.roll_number,
        university_id: Number(updateForm.university_id || user?.id),
        document_type: updateForm.document_type,
        semester: updateForm.semester,
        subjects: updateForm.subjects.map((sub) => ({
          subject_code: sub.subject_code,
          grade: sub.grade,
        })),
        department: updateForm.department || null,
        specialization: updateForm.specialization || null,
      }
      await updateCertificate(selectedUpdateCertificateId, payload)
      setUpdateOpen(false)
      toast.success(`Certificate updated: ${selectedUpdateCertificateId}`)
      if (lookupRollNumber) {
        await handleLookup()
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdating(false)
    }
  }

  const stats = {
    total: issuedCertificates.length,
    active: issuedCertificates.filter((item) => item.status === 'active').length,
    revoked: issuedCertificates.filter((item) => item.status === 'revoked').length,
    tampered: issuedCertificates.filter((item) => item.status === 'tampered').length,
  }

  const semesterChartData = issuedCertificates.reduce((acc, certificate) => {
    const key = String(certificate.semester || 'N/A')
    const found = acc.find((item) => item.semester === key)
    if (found) found.count += 1
    else acc.push({ semester: key, count: 1 })
    return acc
  }, [])

  useEffect(() => {
    if (location.pathname === '/admin/issue') {
      issueSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (location.pathname === '/admin/audit') {
      managementSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.pathname])

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <SpinnerOverlay show={busy} label="Updating certificate..." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-4"><p className="text-sm text-slate-300">Total Certificates</p><p className="text-3xl font-semibold">{stats.total}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-slate-300">Active Certificates</p><p className="text-3xl font-semibold">{stats.active}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-slate-300">Revoked Certificates</p><p className="text-3xl font-semibold">{stats.revoked}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-slate-300">Tampered Attempts</p><p className="text-3xl font-semibold">{stats.tampered}</p></GlassCard>
      </div>

      <GlassCard className="p-5">
        <h3 className="mb-4 text-lg font-semibold">Certificates Issued per Semester</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={semesterChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="semester" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold">University Dashboard</h2>
          <p className="mt-1 text-sm text-slate-300">Issue certificates and review issued records.</p>
        </GlassCard>

        <div ref={issueSectionRef}>
        <GlassCard className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Issue Certificate</h3>
          <form onSubmit={handleIssue} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label="Roll Number" value={form.roll_number} onChange={(e) => setForm((prev) => ({ ...prev, roll_number: e.target.value }))} required />
              <TextInput label="University ID" value={form.university_id} disabled />
              <TextInput label="Semester" value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))} required />
              <TextInput label="Document Type" value={form.document_type} onChange={(e) => setForm((prev) => ({ ...prev, document_type: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-300">Subjects</p>
              {form.subjects.map((subject, index) => (
                <div key={subject.row_id} className="grid gap-2 sm:grid-cols-[1fr,1fr,auto]">
                  <select
                    className="field-input"
                    value={subject.subject_code}
                    onChange={(e) => updateSubject(index, 'subject_code', e.target.value)}
                    required
                  >
                    <option value="">Select subject code</option>
                    {semesterSubjects.map((entry) => (
                      <option key={entry.subject_code} value={entry.subject_code}>
                        {entry.subject_code} - {entry.subject_name}
                      </option>
                    ))}
                  </select>
                  <select className="field-input" value={subject.grade} onChange={(e) => updateSubject(index, 'grade', e.target.value)} required>
                    {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSubjectRow(index)} className="rounded-xl border border-white/15 px-3 hover:bg-white/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSubjectRow} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
                <Plus size={16} /> Add subject
              </button>
            </div>

            <GradientButton type="submit" disabled={issuing}>
              {issuing ? 'Issuing...' : 'Issue Certificate'}
            </GradientButton>

            {resultId && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm">
                <p>Issued successfully: {resultId}</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-2 text-emerald-300"
                  onClick={() => {
                    navigator.clipboard.writeText(resultId)
                    toast.success('Copied')
                  }}
                >
                  <Copy size={15} /> Copy certificate ID
                </button>
              </div>
            )}
          </form>
        </GlassCard>
        </div>

        <div ref={managementSectionRef}>
        <GlassCard className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Certificate Management</h3>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <input
              className="field-input w-full max-w-sm"
              placeholder="Audit lookup by certificate ID (e.g. CERT-ABC12345)"
              value={auditLookupId}
              onChange={(e) => setAuditLookupId(e.target.value)}
            />
            <GradientButton onClick={handleAuditLookup}>Open Audit Logs</GradientButton>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="field-input max-w-64"
              placeholder="Enter roll number"
              value={lookupRollNumber}
              onChange={(e) => setLookupRollNumber(e.target.value)}
            />
            <GradientButton onClick={handleLookup}>{fetchingIssued ? 'Loading...' : 'Fetch'}</GradientButton>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 text-slate-300">
                <tr>
                  <th className="px-2 py-3">Certificate ID</th>
                  <th className="px-2 py-3">Roll Number</th>
                  <th className="px-2 py-3">Semester</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issuedCertificates.map((cert) => (
                  <tr key={cert.certificate_id} className="border-b border-white/10">
                    <td className="px-2 py-3">{cert.certificate_id}</td>
                    <td className="px-2 py-3">{resolvedLookupRoll || '-'}</td>
                    <td className="px-2 py-3">{cert.semester}</td>
                    <td className="px-2 py-3"><Badge status={cert.status} /></td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAudit(cert.certificate_id)}
                          className="rounded-lg border border-white/15 px-2 py-1 hover:bg-white/10"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenUpdate(cert.certificate_id)}
                          className="rounded-lg border border-blue-300/30 px-2 py-1 text-blue-200 hover:bg-blue-500/20"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(cert.certificate_id)}
                          className="rounded-lg border border-red-300/30 px-2 py-1 text-red-200 hover:bg-red-500/20"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
        </div>
      </div>

      <Modal open={auditOpen} onClose={() => setAuditOpen(false)} title={`Audit Logs - ${selectedCertificateId}`}>
        <div className="space-y-3">
          {auditTimeline.length === 0 ? (
            <p className="text-sm text-slate-300">No audit logs found.</p>
          ) : (
            auditTimeline.map((entry, idx) => (
              <div key={`${entry.timestamp}-${idx}`} className="relative pl-6">
                <span className="absolute left-0 top-2 size-2 rounded-full bg-blue-300" />
                {idx < auditTimeline.length - 1 ? (
                  <span className="absolute left-[3px] top-4 h-9 w-px bg-white/20" />
                ) : null}
                <p className="text-sm font-medium capitalize">{entry.action}</p>
                <p className="text-xs text-slate-400">{entry.timestamp}</p>
                <p className="text-sm text-slate-300">{entry.details}</p>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} title={`Update Certificate - ${selectedUpdateCertificateId}`}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Roll Number"
              value={updateForm.roll_number}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, roll_number: e.target.value }))}
              required
            />
            <TextInput
              label="University ID"
              value={updateForm.university_id}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, university_id: e.target.value }))}
              required
            />
            <TextInput
              label="Document Type"
              value={updateForm.document_type}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, document_type: e.target.value }))}
              required
            />
            <TextInput
              label="Semester"
              value={updateForm.semester}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, semester: e.target.value }))}
              required
            />
            <TextInput
              label="Department (optional)"
              value={updateForm.department}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, department: e.target.value }))}
            />
            <TextInput
              label="Specialization (optional)"
              value={updateForm.specialization}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, specialization: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-300">Subjects</p>
            {updateForm.subjects.map((subject, index) => (
              <div key={subject.row_id} className="grid gap-2 sm:grid-cols-[1fr,1fr,auto]">
                <select
                  className="field-input"
                  value={subject.subject_code}
                  onChange={(e) => updateUpdateSubject(index, 'subject_code', e.target.value)}
                  required
                >
                  <option value="">Select subject code</option>
                  {subject.subject_code &&
                  !updateSemesterSubjects.some((entry) => entry.subject_code === subject.subject_code) ? (
                    <option value={subject.subject_code}>{subject.subject_code}</option>
                  ) : null}
                  {updateSemesterSubjects.map((entry) => (
                    <option key={entry.subject_code} value={entry.subject_code}>
                      {entry.subject_code} - {entry.subject_name}
                    </option>
                  ))}
                </select>
                <select
                  className="field-input"
                  value={subject.grade}
                  onChange={(e) => updateUpdateSubject(index, 'grade', e.target.value)}
                  required
                >
                  {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                <button type="button" onClick={() => removeUpdateSubjectRow(index)} className="rounded-xl border border-white/15 px-3 hover:bg-white/10">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addUpdateSubjectRow} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
              <Plus size={16} /> Add subject
            </button>
          </div>

          <GradientButton onClick={handleUpdateCertificate} disabled={updating}>
            {updating ? 'Updating...' : 'Save Updates'}
          </GradientButton>
        </div>
      </Modal>
    </motion.section>
  )
}
