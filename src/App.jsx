// Repo file header
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Landing from './pages/landing/Landing'
import { getStoredAccessToken } from './utils/api'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CurrencySelect from './pages/setup/CurrencySelect'
import CreateOrganization from './pages/setup/CreateOrganization'
import LanguageSelect from './pages/setup/LanguageSelect'
import ManageOrganization from './pages/management/ManageOrganization'
import Dashboard from './pages/dashboard/Dashboard'
import AddTransaction from './pages/transactions/AddTransaction'
import CategoryTransactions from './pages/transactions/CategoryTransactions'
import BookTransactions from './pages/transactions/BookTransactions'
import AllBooks from './pages/books/AllBooks'
import Transactions from './pages/transactions/Transactions'
import TermsOfService from './pages/landing/TermsOfService'
import PrivacyPolicy from './pages/landing/PrivacyPolicy'
import Footer from './components/Footer'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

// Function: syncDocumentLanguage
function syncDocumentLanguage() {
  const language = localStorage.getItem('selectedLanguage') || 'en'
  document.documentElement.lang = language
}

// Function: getThemeForCurrentUser
function getThemeForCurrentUser() {
  const currentUserStr = localStorage.getItem('currentUser')
  if (!currentUserStr) return 'light'
  try {
    const currentUser = JSON.parse(currentUserStr)
    if (currentUser && currentUser.email) {
      return localStorage.getItem(`selectedTheme_${currentUser.email}`) || 'light'
    }
  } catch {
    return 'light'
  }
  return 'light'
}

// Function: SessionExpiryListener
function SessionExpiryListener() {
  const navigate = useNavigate()

  useEffect(() => {
    // Function: handleSessionExpired
    const handleSessionExpired = (event) => {
      const message = event?.detail?.message || 'Your session has expired. Please login again.'
      alert(message)
      sessionStorage.setItem('authNotice', message)
      navigate('/login', { replace: true })
    }

    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [navigate])

  return null
}

// Function: ScrollToTop
function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search, location.hash])

  return null
}

// Function: GlobalApiLoader
function GlobalApiLoader() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Function: handleApiLoading
    const handleApiLoading = (event) => {
      setLoading(!!event?.detail?.loading)
    }

    window.addEventListener('api:loading', handleApiLoading)
    return () => window.removeEventListener('api:loading', handleApiLoading)
  }, [])

  if (!loading) return null

  return (
    <>
      <style>{`
        @keyframes global-loading-bar {
          0% { left: -35%; right: 100%; }
          60% { left: 100%; right: -90%; }
          100% { left: 100%; right: -90%; }
        }
        .global-loader-progress {
          position: absolute;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, #8B5CF6, #EC4899, #8B5CF6, transparent);
          animation: global-loading-bar 1.6s infinite ease-in-out;
        }
      `}</style>
      <div className="fixed inset-x-0 top-0 z-[9999] h-1 bg-violet-100/40">
        <div className="global-loader-progress" style={{ left: 0, right: 0 }} />
      </div>
    </>
  )
}

// Helper to check JWT role on frontend
function checkAdminRole() {
  const token = localStorage.getItem('adminAccessToken')
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload?.role === 'super_admin' && payload?.exp * 1000 > Date.now()
  } catch (e) {
    return false
  }
}

// Protected Route Wrapper for Admin Panel
function AdminGuard({ children }) {
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!checkAdminRole()) {
      localStorage.removeItem('adminAccessToken')
      localStorage.removeItem('adminRefreshToken')
      navigate('/admin/login', { replace: true })
    }
  }, [navigate])

  return checkAdminRole() ? children : null
}

// Protected Route Wrapper for Standard App Users
function RequireAuth({ children }) {
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!getStoredAccessToken()) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return getStoredAccessToken() ? children : null
}

// Impersonation Banner
function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const checkStatus = () => {
      setIsImpersonating(localStorage.getItem('isImpersonating') === 'true')
      setEmail(localStorage.getItem('impersonatedUserEmail') || '')
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleExitImpersonation = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const adminToken = localStorage.getItem('adminAccessToken')
      
      if (adminToken) {
        await fetch(`${apiBaseUrl}/admin/impersonate/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        })
      }
    } catch (e) {
      console.error('Failed to log impersonation stop', e)
    }

    const adminToken = localStorage.getItem('adminAccessToken')
    const adminRefresh = localStorage.getItem('adminRefreshToken')
    const adminUser = localStorage.getItem('adminCurrentUser')

    if (adminToken) {
      localStorage.setItem('accessToken', adminToken)
      localStorage.setItem('refreshToken', adminRefresh)
      localStorage.setItem('currentUser', adminUser)
      localStorage.setItem('isAdmin', 'true')
    } else {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentUser')
      localStorage.removeItem('isAdmin')
    }

    localStorage.removeItem('isImpersonating')
    localStorage.removeItem('impersonatedUserEmail')
    
    setIsImpersonating(false)
    window.location.href = '/admin'
  }

  if (!isImpersonating) return null

  return (
    <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white py-2.5 px-4 text-center text-xs font-light tracking-wide flex items-center justify-center gap-3 z-[999] relative">
      <span>You are currently impersonating <strong className="font-semibold">{email}</strong>. Actions performed are logged under administrative audits.</span>
      <button
        onClick={handleExitImpersonation}
        className="bg-white text-purple-800 px-2.5 py-0.5 rounded-md font-semibold hover:bg-slate-100 transition shadow-sm text-[10px]"
      >
        Exit Session
      </button>
    </div>
  )
}

export default function App(){
  useEffect(() => {
    syncDocumentLanguage()

    // Function: handleStorageChange
    const handleStorageChange = () => {
      syncDocumentLanguage()
      const currentTheme = getThemeForCurrentUser()
      const body = document.body
      const path = window.location.pathname
      const isAdminRoute = path === '/admin' || path === '/admin/login'
      if (path === '/' || path === '/index.html' || isAdminRoute) {
        body.classList.remove('theme-light-violet')
        body.classList.add('dark')
      } else {
        if (currentTheme === 'dark') {
          body.classList.remove('theme-light-violet')
          body.classList.add('dark')
        } else {
          body.classList.add('theme-light-violet')
          body.classList.remove('dark')
        }
      }
    }
    // Function: handleLanguageChanged
    const handleLanguageChanged = () => syncDocumentLanguage()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('language:changed', handleLanguageChanged)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('language:changed', handleLanguageChanged)
    }
  }, [])

  return (
    <BrowserRouter>
      <ThemeRouterSync />
      <GlobalApiLoader />
      <SessionExpiryListener />
      <ScrollToTop />
      <ImpersonationBanner />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 overflow-hidden bg-transparent">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/select-currency" element={<RequireAuth><CurrencySelect /></RequireAuth>} />
            <Route path="/select-language" element={<RequireAuth><LanguageSelect /></RequireAuth>} />
            <Route path="/create-organization" element={<RequireAuth><CreateOrganization /></RequireAuth>} />
            <Route path="/manage-organization" element={<RequireAuth><ManageOrganization /></RequireAuth>} />
            <Route path="/add-transaction" element={<RequireAuth><AddTransaction /></RequireAuth>} />
            <Route path="/edit-transaction/:transactionId" element={<RequireAuth><AddTransaction /></RequireAuth>} />
            <Route path="/transactions" element={<RequireAuth><Transactions /></RequireAuth>} />
            <Route path="/category/:categoryName" element={<RequireAuth><CategoryTransactions /></RequireAuth>} />
            <Route path="/book-transactions/:bookName" element={<RequireAuth><BookTransactions /></RequireAuth>} />
            <Route path="/all-books" element={<RequireAuth><AllBooks /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            } />
          </Routes>
        </main>
        {/* Render short footer on all pages except the Landing (home) page */}
        <RenderFooterUnlessHome />
      </div>
    </BrowserRouter>
  )
}

// Function: ThemeRouterSync
function ThemeRouterSync() {
  const location = useLocation()

  useEffect(() => {
    const body = document.body
    const savedTheme = getThemeForCurrentUser()

    const path = location.pathname
    const isAdminRoute = path === '/admin' || path === '/admin/login'

    if (path === '/' || path === '/index.html' || isAdminRoute) {
      body.classList.remove('theme-light-violet')
      body.classList.add('dark')
    } else {
      if (savedTheme === 'dark') {
        body.classList.remove('theme-light-violet')
        body.classList.add('dark')
      } else {
        body.classList.add('theme-light-violet')
        body.classList.remove('dark')
      }
    }
  }, [location])

  return null
}

// Function: RenderFooterUnlessHome
function RenderFooterUnlessHome() {
  const location = useLocation()
  const path = location?.pathname || ''
  // Only render footer on dashboard, terms, and privacy pages
  if (path === '/dashboard' || path === '/terms' || path === '/privacy') {
    return <Footer />
  }
  return null
}