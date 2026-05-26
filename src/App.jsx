import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import CurrencySelect from './pages/CurrencySelect'
import CreateOrganization from './pages/CreateOrganization'
import LanguageSelect from './pages/LanguageSelect'
import ManageOrganization from './pages/ManageOrganization'
import Dashboard from './pages/Dashboard'
import AddTransaction from './pages/AddTransaction'
import ModuleTransactions from './pages/ModuleTransactions'
import Transactions from './pages/Transactions'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Footer from './components/Footer'

function syncDocumentLanguage() {
  const language = localStorage.getItem('selectedLanguage') || 'en'
  document.documentElement.lang = language
}

function SessionExpiryListener() {
  const navigate = useNavigate()

  useEffect(() => {
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

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search, location.hash])

  return null
}

export default function App(){
  useEffect(() => {
    syncDocumentLanguage()

    const handleStorageChange = () => syncDocumentLanguage()
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

function RenderFooterUnlessHome() {
  const location = useLocation()
  // hide the short copyright footer on the home page where we show a full company footer
  if (location?.pathname === '/') return null
  return <Footer />
}