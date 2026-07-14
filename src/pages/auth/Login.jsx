// Repo file header
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest, setStoredAccessToken, setStoredRefreshToken, getStoredAccessToken } from '../../utils/api'
import logo from '../../assets/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')

  const handleSendResetLink = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')

    if (!forgotEmail) {
      setForgotError('Please enter your email address')
      return
    }

    setForgotLoading(true)

    try {
      const payload = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })

      setForgotSuccess(
        payload?.message || 'If your email is registered, we have sent you a password reset link.'
      )
      setForgotEmail('')
    } catch (err) {
      setForgotError(err?.message || 'Failed to send password reset link. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => {
    if (getStoredAccessToken()) {
      navigate('/dashboard', { replace: true })
      return
    }

    const storedNotice = sessionStorage.getItem('authNotice')
    const routeNotice = location.state?.message
    const notice = routeNotice || storedNotice

    if (notice) {
      setError(notice)
      sessionStorage.removeItem('authNotice')
    }
  }, [location.state, navigate])

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
      if (!email || !password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      if (!showOtp) {
        // Step 1: Send OTP
        await apiRequest('/auth/login/send-otp', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setShowOtp(true)
      } else {
        // Step 2: Complete Login
        if (!otp) {
          setError('Please enter the verification code')
          setLoading(false)
          return
        }

        const payload = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, otp }),
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
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="theme-light-violet relative min-h-screen overflow-y-auto flex items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md my-auto"
      >
        <div className="inner-card-accent bg-[var(--card)] rounded-2xl shadow-glass p-4 sm:p-5">
          {/* Back button */}
          <div className="mb-2 flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/8 bg-[var(--bg-2)] px-2.5 py-1 text-xs font-light text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ArrowLeftIcon className="h-3 w-3" />
              Back
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-2">
            <img src={logo} alt="PocketFlow Logo" className="mx-auto h-12 w-auto object-contain mb-1" />
            <h1 className="text-xl font-light text-[var(--text)]">
              Welcome Back
            </h1>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Sign in to your PocketFlow account
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2 rounded-lg bg-red-900/10 border border-red-200 text-rose-400 text-xs"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-2.5">
            {!showOtp ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-xs font-light text-[var(--text)] mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-white/6 bg-[var(--card)] text-sm text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-light text-[var(--text)] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 pr-10 py-2 rounded-lg border border-white/6 bg-[var(--card)] text-sm text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer"></label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-primary-600 hover:text-primary-700 font-light focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="otp" className="block text-xs font-light text-[var(--text)] mb-1">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-3 py-2 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-center tracking-widest text-base font-bold"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted)] text-center leading-tight">
                    Enter the 6-digit verification code sent to your email.
                  </p>
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtp(false)
                      setError('')
                    }}
                    className="text-primary-600 hover:text-primary-700 font-light text-xs focus:outline-none"
                  >
                    &larr; Back to login details
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2 rounded-lg accent-cta text-sm font-light shadow-glass hover:shadow-primary-500/40 transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : showOtp ? 'Verify & Sign In' : 'Sign In'}
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

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[var(--card)] rounded-2xl shadow-glass p-6 sm:p-8 border border-white/10"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-light text-[var(--text)]">Forgot Password</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {forgotError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/10 border border-red-200 text-rose-400 text-sm">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-900/10 border border-emerald-200 text-emerald-400 text-sm">
                  {forgotSuccess}
                </div>
              )}

              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-light text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false)
                      setForgotError('')
                      setForgotSuccess('')
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-[var(--text)] font-light hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 px-4 py-2.5 rounded-lg accent-cta font-light shadow-glass hover:shadow-primary-500/40 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
