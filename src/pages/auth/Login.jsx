// Repo file header
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest, setStoredAccessToken, setStoredRefreshToken } from '../../utils/api'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedNotice = sessionStorage.getItem('authNotice')
    const routeNotice = location.state?.message
    const notice = routeNotice || storedNotice

    if (notice) {
      setError(notice)
      sessionStorage.removeItem('authNotice')
    }
  }, [location.state])

  // Function: deriveFirstName
  const deriveFirstName = (value) => {
    const localPart = value.split('@')[0] || 'user'
    return localPart.split(/[._-]/)[0].replace(/^[a-z]/, (letter) => letter.toUpperCase())
  }

  // Function: handleLogin
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Client-side validation
      if (!email || !password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }
      // Call backend login
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const user = payload?.data?.user
      const accessToken = payload?.data?.accessToken || ''
      const refreshToken = payload?.data?.refreshToken || ''

      setStoredAccessToken(accessToken)
      setStoredRefreshToken(refreshToken)

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="theme-light-violet relative h-screen overflow-hidden flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="inner-card-accent bg-[var(--card)] rounded-2xl shadow-glass p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white font-light text-lg mx-auto mb-4">
              FT
            </div>
            <h1 className="text-3xl font-light text-[var(--text)]">Welcome Back</h1>
            <p className="mt-2 text-[var(--muted)]">Sign in to your FinTrack account</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-900/10 border border-red-200 text-rose-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-light text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-light text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                {/* <input type="checkbox" className="rounded border-slate-300" /> */}
                {/* <span className="text-[var(--muted)]">Remember me</span> */}
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-light">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-4 py-2.5 rounded-lg accent-cta font-light shadow-glass hover:shadow-primary-500/40 transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/6" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--card)] text-slate-500">or</span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[var(--muted)]">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-light hover:text-primary-700">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
