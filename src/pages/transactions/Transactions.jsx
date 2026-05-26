// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, BuildingOffice2Icon, CalendarDaysIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { authenticatedFetch } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../../utils/organizationSync'

import translations, {
  getLocale,
  translateText,
  translateModuleLabel,
} from '../../i18n/translations'

// Read JSON from localStorage
// Function: readJSON
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Function: capitalize
function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

// Function: formatMoney
function formatMoney(value, currency, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${Number(value || 0).toFixed(2)}`
  }
}

// Function: formatDateTime
function formatDateTime(value, locale = 'en-US') {
  if (!value) {
    return translateText(locale === 'mr-IN' ? 'mr' : 'en', 'noDate')
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return translateText(locale === 'mr-IN' ? 'mr' : 'en', 'noDate')
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// Categorize transaction type
// Function: getTransactionCategory
function getTransactionCategory(transaction) {
  const transactionType = String(transaction?.transactionType || '').toLowerCase()

  if (['revenue', 'income', 'in', 'credit', 'incoming', 'plus', '+'].includes(transactionType)) {
    return 'revenue'
  }

  if (['expense', 'expenses', 'out', 'debit', 'outgoing', 'minus', '-'].includes(transactionType)) {
    return 'expenses'
  }

  if (['investment', 'investments'].includes(transactionType)) {
    return 'investments'
  }

  if (transaction?.direction === 'investments' || transaction?.transactionDirection === 'investments') {
    return 'investments'
  }

  if (transaction?.direction === 'in' || transaction?.transactionDirection === 'in') {
    return 'revenue'
  }

  if (transaction?.direction === 'out' || transaction?.transactionDirection === 'out') {
    return 'expenses'
  }

  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 'expenses'
  }

  return amount < 0 ? 'expenses' : 'revenue'
}

// Function: getTransactionDirection
function getTransactionDirection(transaction) {
  return getTransactionCategory(transaction) === 'expenses' ? 'out' : 'in'
}

// Function: getSignedTransactionAmount
function getSignedTransactionAmount(transaction) {
  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 0
  }

  const category = getTransactionCategory(transaction)
  if (category === 'expenses') {
    return -Math.abs(amount)
  }

  return Math.abs(amount)
}

// Build edit route path
// Function: getTransactionEditPath
function getTransactionEditPath(transaction) {
  const transactionId = String(transaction?.id || transaction?._id || '')
  return transactionId ? `/edit-transaction/${encodeURIComponent(transactionId)}` : '/add-transaction'
}

// All transactions listing
export default function Transactions() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  const [language, setLanguage] = useState(() => localStorage.getItem('selectedLanguage') || 'en')

  useEffect(() => {
    let cancelled = false

    loadOrganizationsFromBackend().then((refreshedOrganizations) => {
      if (!cancelled) {
        setOrganizations(refreshedOrganizations)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // Function: handleLanguageChanged
    const handleLanguageChanged = (event) => {
      // Function: newLanguage
      const newLanguage = (event && event.detail && event.detail.language) || localStorage.getItem('selectedLanguage') || 'en'
      setLanguage(newLanguage)
    }

    // Function: handleStorage
    const handleStorage = (event) => {
      if (event.key === 'selectedLanguage') {
        setLanguage(event.newValue || 'en')
      }
    }

    window.addEventListener('language:changed', handleLanguageChanged)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('language:changed', handleLanguageChanged)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const transactions = useMemo(() => readJSON('transactions', []), [])
  const text = translations[language] || translations.en
  const locale = getLocale(language)

  const organizationTransactions = useMemo(() => {
    if (!activeOrganization) {
      return []
    }

    return [...transactions]
      .filter((transaction) => {
        if (transaction.organizationId && transaction.organizationId !== activeOrganization.id) {
          return false
        }

        return true
      })
      .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
  }, [transactions, activeOrganization])

  // Function: handleDownloadReport
  const handleDownloadReport = async () => {
    if (!activeOrganization) {
      return
    }

    try {
      const response = await authenticatedFetch(`/dashboard/report?organizationId=${encodeURIComponent(activeOrganization.id)}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.message || text.downloadReportFailed)
      }

      const payload = await response.json()
      const reportData = payload?.data || {}
      const base64Pdf = reportData.base64 || ''

      if (!base64Pdf) {
        throw new Error(text.downloadReportFailed)
      }

      const binaryString = atob(base64Pdf)
      const bytes = new Uint8Array(binaryString.length)
      for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index)
      }

      const pdfBlob = new Blob([bytes], { type: reportData.contentType || 'application/pdf' })
      const downloadUrl = URL.createObjectURL(pdfBlob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = reportData.filename || `workspace-report-${activeOrganization?.organizationName || 'report'}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error(err)
      alert(text.downloadReportFailed)
    }
  }

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center px-4">
        <div className="inner-card-accent w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <h1 className="text-3xl font-light tracking-tight text-[var(--text)]">{text.noOrganizationFound}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.createOrganizationFirst}</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25">
            {text.createOrganization}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-light-violet min-h-screen px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {text.backToDashboard}
          </button>

          <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
            {text.allTransactions}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inner-card-accent rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/4 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">{text.organizationTransactions}</p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-[var(--text)]">{activeOrganization.organizationName}</h1>
              <p className="mt-2 text-sm text-slate-500">{text.transactionsDescription}</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:justify-end sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center justify-center gap-2 rounded-full accent-cta px-5 py-3 text-sm font-light transition hover:-translate-y-0.5"
              >
                {text.addTransaction}
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-5 py-3 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {text.downloadReport}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
              <BuildingOffice2Icon className="h-4 w-4" />
              {translateText(language, 'transactionsCount', { count: organizationTransactions.length })}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-light text-violet-700">
              <CalendarDaysIcon className="h-4 w-4" />
              {text.latestFirst}
            </div>
          </div>

          {organizationTransactions.length > 0 ? (
            <div className="mt-6 space-y-3">
              {organizationTransactions.map((transaction, index) => {
                const amount = getSignedTransactionAmount(transaction)
                const editPath = getTransactionEditPath(transaction)

                return (
                  <Link
                    // key={transaction.id || `${transaction.module || 'txn'}-${index}`}
                    key={transaction.id || `${translateModuleLabel(language, transaction.module) || 'txn'}-${index}`}
                    to={editPath}
                    className="block rounded-2xl border border-white/6 bg-[var(--card)] transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: index * 0.03, duration: 0.35 }}
                      className="flex items-center justify-between rounded-2xl px-4 py-4"
                    >
                      <div>
                        {/* <p className="font-light text-[var(--text)]">{transaction.note?.trim() || `${capitalize(transaction.module || text.transaction)} ${text.update}`}</p> */}
                        <p className="font-light text-[var(--text)]">{transaction.note?.trim() || `${capitalize(translateModuleLabel(language, transaction.module) || text.transaction)} ${text.update}`}</p>
                        <p className="text-sm text-slate-500">
                          {/* {capitalize(transaction.module || text.transaction)} · {formatDateTime(transaction.createdAt || transaction.date, locale)} */}
                          {capitalize(translateModuleLabel(language, transaction.module) || text.transaction)} · {formatDateTime(transaction.createdAt || transaction.date, locale)}
                        </p>
                      </div>
                      <p className={`text-sm font-light ${amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {amount >= 0 ? '+' : '-'}{formatMoney(Math.abs(amount), selectedCurrency, locale)}
                      </p>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-[var(--card)] px-4 py-6 text-sm text-slate-500">
              {text.noTransactionsFoundForOrganization}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}