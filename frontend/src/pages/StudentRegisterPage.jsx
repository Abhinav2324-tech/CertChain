import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { registerStudent } from '../api/student'
import { GradientButton } from '../components/ui/GradientButton'
import { GlassCard } from '../components/ui/GlassCard'
import { TextInput } from '../components/ui/TextInput'
import { DEPARTMENTS, SPECIALIZATIONS } from '../utils/constants'

export default function StudentRegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    roll_number: '',
    password: '',
    department: '',
    specialization: '',
  })

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await registerStudent(form)
      toast.success('Student registered successfully')
      navigate('/login')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="mx-auto w-full max-w-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Student Registration</h2>
        <p className="mt-2 text-sm text-slate-300">Create your CertChain student account.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <TextInput label="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <TextInput label="Roll Number" value={form.roll_number} onChange={(e) => setForm((p) => ({ ...p, roll_number: e.target.value }))} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Department</span>
            <select className="field-input" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} required>
              <option value="">Select department</option>
              {DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Specialization</span>
            <select className="field-input" value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} required>
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <GradientButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register as Student'}
          </GradientButton>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Already registered? <Link to="/login" className="text-blue-300 hover:underline">Login here</Link>
        </p>
      </GlassCard>
    </motion.section>
  )
}
