// Repo file header
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.png'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rateLimitWait, setRateLimitWait] = useState(0)

  // Rate limit cooldown timer
  useEffect(() => {
    if (rateLimitWait <= 0) return
    const timer = setInterval(() => {
      setRateLimitWait((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [rateLimitWait])

  // Redirect if already logged in as admin
  useEffect(() => {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (adminToken) {
      try {
        const payload = JSON.parse(atob(adminToken.split('.')[1]))
        if ((payload?.role === 'super_admin' || payload?.role === 'admin') && payload?.exp * 1000 > Date.now()) {
          navigate('/admin')
        }
      } catch (e) {
        // invalid token
      }
    }
  }, [navigate])

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const response = await fetch(`${apiBaseUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitWait(900) // 15 minutes lockout in seconds
          throw new Error('Too many failed attempts. You are locked out for 15 minutes.')
        }
        throw new Error(data.message || 'Login failed')
      }

      const payload = data.data || {}
      
      // Store dedicated admin tokens
      localStorage.setItem('adminAccessToken', payload.accessToken)
      localStorage.setItem('adminRefreshToken', payload.refreshToken)
      localStorage.setItem('adminCurrentUser', JSON.stringify(payload.user))
      
      // Sync into standard active session
      localStorage.setItem('accessToken', payload.accessToken)
      localStorage.setItem('refreshToken', payload.refreshToken)
      localStorage.setItem('currentUser', JSON.stringify(payload.user))
      localStorage.setItem('isAdmin', 'true')

      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-8 overflow-hidden select-none">
      {/* Dynamic Purple/Indigo Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-[160px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Back to Client App Link */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 inline-flex items-center gap-2 text-xs font-light text-slate-400 hover:text-slate-200 transition duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
        </button>

        {/* Card Frame */}
        <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-purple-900/20 border border-purple-500/20 mb-4">
              <img src={logo} alt="PocketFlow Logo" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">
              Admin Gateway
            </h1>
            <p className="mt-2 text-xs font-light text-slate-400">
              Access the administrative operations control room
            </p>
          </div>

          {/* Alert Notification */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-2xl bg-red-950/30 border border-red-500/20 flex gap-3 text-red-300 text-xs font-light leading-relaxed"
            >
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <span className="font-semibold block mb-0.5">Access Denied</span>
                {error}
                {rateLimitWait > 0 && (
                  <span className="block mt-1 font-semibold text-purple-400">
                    Remaining Lockout: {Math.floor(rateLimitWait / 60)}m {rateLimitWait % 60}s
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-light text-slate-400 mb-2">
                Security Identity (Email)
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading || rateLimitWait > 0}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pocketflow.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition duration-200 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-light text-slate-400 mb-2">
                Security Key (Password)
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading || rateLimitWait > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition duration-200 disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={rateLimitWait > 0}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-300 transition duration-200 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || rateLimitWait > 0}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.5)] transition duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying Gateway...' : 'Authenticate Access'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
