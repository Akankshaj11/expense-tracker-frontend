// Repo file header
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, setStoredAccessToken, setStoredRefreshToken, getStoredAccessToken } from '../../utils/api'
import logo from '../../assets/logo.png'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')

  // Function: isPasswordValid
  const isPasswordValid = (val) => {
    if (!val) return true
    return (
      val.length >= 6 &&
      /[A-Z]/.test(val) &&
      /[a-z]/.test(val) &&
      /\d/.test(val) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(val)
    )
  }

  // Function: deriveFirstName
  const deriveFirstName = (value) => {
    const localPart = value.split('@')[0] || 'user'
    return localPart.split(/[._-]/)[0].replace(/^[a-z]/, (letter) => letter.toUpperCase())
  }

  useEffect(() => {
    if (getStoredAccessToken()) {
      navigate('/dashboard', { replace: true })
      return
    }

    const seededEmail = sessionStorage.getItem('signupEmail')
    if (seededEmail) {
      setEmail(seededEmail)
      sessionStorage.removeItem('signupEmail')
    }
  }, [navigate])

  // Function: handleRegister
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter')
        setLoading(false)
        return
      }
      if (!/[a-z]/.test(password)) {
        setError('Password must contain at least one lowercase letter')
        setLoading(false)
        return
      }
      if (!/\d/.test(password)) {
        setError('Password must contain at least one number')
        setLoading(false)
        return
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setError('Password must contain at least one special character')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      if (!showOtp) {
        // Step 1: Send OTP
        await apiRequest('/auth/register/send-otp', {
          method: 'POST',
          body: JSON.stringify({ email }),
        })
        setShowOtp(true)
      } else {
        // Step 2: Complete registration
        if (!otp) {
          setError('Please enter the verification code')
          setLoading(false)
          return
        }

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
      }
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
              Get Started
            </h1>
            <p className="mt-0.5 text-xs text-[var(--primary-600)]">
              Create your PocketFlow account
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
          <form onSubmit={handleRegister} className="space-y-2.5">
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
                    className="w-full px-3 py-2 rounded-lg border border-white/6 bg-[var(--card)] text-sm text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
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
                      className="w-full px-3 pr-10 py-2 rounded-lg border border-white/6 bg-[var(--card)] text-sm text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
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
                  {password && !isPasswordValid(password) && (
                    <p className="mt-0.5 text-[10px] text-rose-500 leading-tight">
                      Password must be at least 6 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-light text-[var(--text)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 pr-10 py-2 rounded-lg border border-white/6 bg-[var(--card)] text-sm text-[var(--text)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition input-glass"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
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
                    &larr; Back to account details
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2 rounded-lg accent-cta text-sm font-light shadow-glass hover:shadow-primary-500/40 transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : showOtp ? 'Verify & Create Account' : 'Create Account'}
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
