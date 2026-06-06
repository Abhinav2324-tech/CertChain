import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { loginStudent } from '../api/student'
import { GradientButton } from '../components/ui/GradientButton'
import { GlassCard } from '../components/ui/GlassCard'
import { TextInput } from '../components/ui/TextInput'
import { useAppStore } from '../store/useAppStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAppStore((state) => state.setAuth)
  const [form, setForm] = useState({ roll_number: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await loginStudent(form)
      setAuth({
        role: 'STUDENT',
        user: {
          id: response.student_id,
          name: response.name,
          roll_number: response.roll_number,
        },
      })
      toast.success('Login successful')
      navigate('/dashboard')
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
        <h2 className="text-2xl font-semibold">Student Login</h2>
        <p className="mt-2 text-sm text-slate-300">Access your academic certificates dashboard.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <TextInput
            label="Roll Number"
            value={form.roll_number}
            onChange={(e) => setForm((prev) => ({ ...prev, roll_number: e.target.value }))}
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
            {loading ? 'Signing in...' : 'Login'}
          </GradientButton>
        </form>
        <p className="mt-4 text-sm text-slate-300">
          New student? <Link to="/register" className="text-blue-300 hover:underline">Register here</Link>
        </p>
      </GlassCard>
    </motion.section>
  )
}
