import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import { GlassCard } from './components/ui/GlassCard'
import { useAppStore } from './store/useAppStore'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminRegisterPage from './pages/AdminRegisterPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CertificateViewerPage from './pages/CertificateViewerPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import StudentRegisterPage from './pages/StudentRegisterPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import VerifyPage from './pages/VerifyPage'

function App() {
  const location = useLocation()
  const { role, darkMode } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.25),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.22),_transparent_40%)]" />
      <main className="relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<StudentRegisterPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin-register" element={<AdminRegisterPage />} />
            <Route
              path="/dashboard"
              element={
                role === 'STUDENT' ? (
                  <AppLayout>
                    <StudentDashboardPage />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard/certificates"
              element={
                role === 'STUDENT' ? (
                  <AppLayout>
                    <StudentDashboardPage />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                role === 'ADMIN' ? (
                  <AppLayout>
                    <AdminDashboardPage />
                  </AppLayout>
                ) : (
                  <Navigate to="/admin-login" replace />
                )
              }
            />
            <Route
              path="/admin/issue"
              element={
                role === 'ADMIN' ? (
                  <AppLayout>
                    <AdminDashboardPage />
                  </AppLayout>
                ) : (
                  <Navigate to="/admin-login" replace />
                )
              }
            />
            <Route
              path="/admin/audit"
              element={
                role === 'ADMIN' ? (
                  <AppLayout>
                    <AdminDashboardPage />
                  </AppLayout>
                ) : (
                  <Navigate to="/admin-login" replace />
                )
              }
            />
            <Route
              path="/certificate/:certificateId"
              element={
                role ? (
                  <AppLayout>
                    <CertificateViewerPage />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/verify/:certificate_id" element={<VerifyPage />} />
            <Route
              path="*"
              element={
                <GlassCard className="mx-auto max-w-xl p-8 text-center">
                  <h2 className="text-2xl font-semibold">Page not found</h2>
                  <p className="mt-3 text-slate-300">Use the navigation to continue.</p>
                </GlassCard>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
