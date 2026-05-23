import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
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
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}