// Repo file header
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, setStoredAccessToken, setStoredRefreshToken } from '../../utils/api'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Function: deriveFirstName
  const deriveFirstName = (value) => {
    const localPart = value.split('@')[0] || 'user'
    return localPart.split(/[._-]/)[0].replace(/^[a-z]/, (letter) => letter.toUpperCase())
  }

  useEffect(() => {
    const seededEmail = sessionStorage.getItem('signupEmail')
    if (seededEmail) {
      setEmail(seededEmail)
      sessionStorage.removeItem('signupEmail')
    }
  }, [])

  // Function: handleRegister
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Client-side validation
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (!showOtpInput) {
        // Step 1: Send OTP
        await apiRequest('/auth/register/send-otp', {
          method: 'POST',
          body: JSON.stringify({ email }),
        })
        setShowOtpInput(true)
        setLoading(false)
        return
      }

      // Step 2: Verify OTP
      if (!otp) {
        setError('Please enter the OTP sent to your email')
        setLoading(false)
        return
      }

      // Call backend register with OTP
      const payload = await apiRequest('/auth/register', {
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
        sessionStorage.setItem('onboardingUser', JSON.stringify(user))
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/select-currency')
      }, 1200)
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="theme-light-violet relative min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <CheckCircleIcon className="h-16 w-16 text-primary-600 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-light text-[var(--text)] mb-2">Account Created!</h2>
          <p className="text-[var(--muted)]">Redirecting to currency setup...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="theme-light-violet relative flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
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
            <h1 className="text-3xl font-light text-[var(--text)]">
              {showOtpInput ? 'Verify Your Email' : 'Get Started'}
            </h1>
            <p className="mt-2 text-[var(--primary-600)]">
              {showOtpInput
                ? 'We\'ve sent a verification code to your email'
                : 'Create your FinTrack account'}
            </p>
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
          <form onSubmit={handleRegister} className="space-y-4">
            {!showOtpInput ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-light text-[var(--text)] mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-light text-[var(--text)] mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
                  />
                  <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-light text-[var(--text)] mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-light text-[var(--text)] mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/6 bg-[var(--card)] text-[var(--text)] text-center tracking-widest text-lg placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setShowOtpInput(false)}
                    className="text-primary-600 hover:text-primary-700 font-light"
                  >
                    ← Back to Details
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-4 py-2.5 rounded-lg accent-cta font-light shadow-glass hover:shadow-primary-500/40 transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (showOtpInput ? 'Creating account...' : 'Sending OTP...') : (showOtpInput ? 'Verify & Create Account' : 'Send OTP & Create Account')}
              {!loading && <ArrowRightIcon className="h-4 w-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-[var(--muted)]">or</span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[var(--muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-light hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
