import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { registerUniversity } from '../api/university'
import { GradientButton } from '../components/ui/GradientButton'
import { GlassCard } from '../components/ui/GlassCard'
import { TextInput } from '../components/ui/TextInput'

export default function AdminRegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await registerUniversity(form)
      toast.success('University registered successfully')
      navigate('/admin-login')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="mx-auto w-full max-w-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">University Registration</h2>
        <p className="mt-2 text-sm text-slate-300">Create university/admin access for certificate issuance.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <TextInput label="University Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <TextInput label="University Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <TextInput label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          <GradientButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register University'}
          </GradientButton>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Already registered? <Link to="/admin-login" className="text-blue-300 hover:underline">Login here</Link>
        </p>
      </GlassCard>
    </motion.section>
  )
}
