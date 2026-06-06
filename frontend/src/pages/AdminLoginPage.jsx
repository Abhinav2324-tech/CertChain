import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { loginUniversity } from '../api/university'
import { GradientButton } from '../components/ui/GradientButton'
import { GlassCard } from '../components/ui/GlassCard'
import { TextInput } from '../components/ui/TextInput'
import { useAppStore } from '../store/useAppStore'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAppStore((state) => state.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await loginUniversity(form)
      setAuth({
        role: 'ADMIN',
        user: {
          id: response.university_id,
          name: response.name,
          email: response.email,
        },
      })
      toast.success('University login successful')
      navigate('/admin')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="mx-auto w-full max-w-md p-6 sm:p-8">
        <Link to="/" className="text-sm text-blue-300 hover:underline">Back to home</Link>
        <h2 className="text-2xl font-semibold">University Login</h2>
        <p className="mt-2 text-sm text-slate-300">Authenticate to issue and manage certificates.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <TextInput
            label="University Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <TextInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <GradientButton type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Login as University'}
          </GradientButton>
        </form>
        <p className="mt-4 text-sm text-slate-300">
          New university? <Link to="/admin-register" className="text-blue-300 hover:underline">Register here</Link>
        </p>
      </GlassCard>
    </motion.section>
  )
}
