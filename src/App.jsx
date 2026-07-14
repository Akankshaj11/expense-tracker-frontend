// Repo file header
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Landing from './pages/landing/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CurrencySelect from './pages/setup/CurrencySelect'
import CreateOrganization from './pages/setup/CreateOrganization'
import LanguageSelect from './pages/setup/LanguageSelect'
import ManageOrganization from './pages/management/ManageOrganization'
import Dashboard from './pages/dashboard/Dashboard'
import AddTransaction from './pages/transactions/AddTransaction'
import ModuleTransactions from './pages/transactions/ModuleTransactions'
import Transactions from './pages/transactions/Transactions'
import TermsOfService from './pages/landing/TermsOfService'
import PrivacyPolicy from './pages/landing/PrivacyPolicy'
import Footer from './components/Footer'

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

export default function App(){
  useEffect(() => {
    syncDocumentLanguage()

    // Function: handleStorageChange
    const handleStorageChange = () => {
      syncDocumentLanguage()
      const currentTheme = getThemeForCurrentUser()
      const path = window.location.pathname
      const isInnerRoute =
        path === '/dashboard' ||
        path === '/transactions' ||
        path.startsWith('/module/') ||
        path === '/manage-organization' ||
        path.startsWith('/edit-transaction/') ||
        path === '/add-transaction'
      
      const body = document.body
      if (isInnerRoute && currentTheme === 'dark') {
        body.classList.remove('theme-light-violet')
        body.classList.add('dark')
      } else {
        body.classList.add('theme-light-violet')
        body.classList.remove('dark')
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
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 overflow-hidden bg-slate-50">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/select-currency" element={<CurrencySelect />} />
            <Route path="/select-language" element={<LanguageSelect />} />
            <Route path="/create-organization" element={<CreateOrganization />} />
            <Route path="/manage-organization" element={<ManageOrganization />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/edit-transaction/:transactionId" element={<AddTransaction />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/module/:moduleName" element={<ModuleTransactions />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
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
    const path = location.pathname
    const body = document.body
    const savedTheme = getThemeForCurrentUser()

    const isInnerRoute =
      path === '/dashboard' ||
      path === '/transactions' ||
      path.startsWith('/module/') ||
      path === '/manage-organization' ||
      path.startsWith('/edit-transaction/') ||
      path === '/add-transaction' ||
      (path === '/create-organization' && location.state?.from === '/dashboard')

    if (isInnerRoute && savedTheme === 'dark') {
      body.classList.remove('theme-light-violet')
      body.classList.add('dark')
    } else {
      body.classList.add('theme-light-violet')
      body.classList.remove('dark')
    }
  }, [location])

  return null
}

// Function: RenderFooterUnlessHome
function RenderFooterUnlessHome() {
  const location = useLocation()
  // hide the short copyright footer on the home page where we show a full company footer
  if (location?.pathname === '/') return null
  return <Footer />
}