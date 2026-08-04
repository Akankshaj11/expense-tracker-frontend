// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, BuildingOffice2Icon, CalendarDaysIcon, ArrowDownTrayIcon, PaperClipIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { authenticatedFetch } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations, loadTransactionsFromBackend } from '../../utils/organizationSync'

import translations, {
  getLocale,
  translateText,
  translateCategoryLabel,
} from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'

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
  const [transactionsRevision, setTransactionsRevision] = useState(0)
  const [attachmentCache, setAttachmentCache] = useState(() => readJSON('attachments', []))
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // Function: handleStorage
    const handleStorage = (event) => {
      if (event.key === 'transactions' || event.key === 'attachments') {
        setAttachmentCache(readJSON('attachments', []))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const resolveAttachmentPreview = (transaction) => {
    const dataUrl = transaction.attachmentDataUrl || transaction.attachment?.url || transaction.attachment?.dataUrl
    const name = transaction.attachmentName || transaction.attachment?.name
    const type = transaction.attachmentType || transaction.attachment?.type

    if (dataUrl && dataUrl !== 'None' && dataUrl !== 'null') {
      return {
        name: (name === 'None' || name === 'null' || !name) ? 'Attachment' : name,
        type: (type === 'None' || type === 'null' || !type) ? '' : type,
        dataUrl,
      }
    }

    const cached = attachmentCache.find((item) => item.transactionId === (transaction.id || transaction._id))
    if (cached && cached.dataUrl && cached.dataUrl !== 'None' && cached.dataUrl !== 'null') {
      return {
        name: (cached.name === 'None' || cached.name === 'null' || !cached.name) ? 'Attachment' : cached.name,
        type: (cached.type === 'None' || cached.type === 'null' || !cached.type) ? '' : cached.type,
        dataUrl: cached.dataUrl,
      }
    }
    return null
  }

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



  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''

  useEffect(() => {
    if (activeOrgId) {
      loadTransactionsFromBackend(activeOrgId)
    }
  }, [activeOrgId])

  useEffect(() => {
    // Function: handleTransactionsUpdated
    const handleTransactionsUpdated = () => {
      setTransactionsRevision((current) => current + 1)
    }

    window.addEventListener('transactions:updated', handleTransactionsUpdated)
    return () => {
      window.removeEventListener('transactions:updated', handleTransactionsUpdated)
    }
  }, [])

  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const transactions = useMemo(() => readJSON('transactions', []), [transactionsRevision])
  const { language, text } = useLanguage()
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

        if (directionFilter !== 'all') {
          const dir = String(transaction.direction || '').toLowerCase()
          if (dir !== directionFilter) {
            return false
          }
        }

        const txnDateStr = transaction.date || (transaction.createdAt ? transaction.createdAt.split('T')[0] : '')
        if (startDate && txnDateStr && txnDateStr < startDate) {
          return false
        }
        if (endDate && txnDateStr && txnDateStr > endDate) {
          return false
        }

        if (searchTerm) {
          const query = searchTerm.toLowerCase()
          const note = String(transaction.note || '').toLowerCase()
          const category = String(transaction.category || '').toLowerCase()
          const subcategory = String(transaction.subcategory || '').toLowerCase()
          const amount = String(transaction.amount || '')
          if (!note.includes(query) && !category.includes(query) && !subcategory.includes(query) && !amount.includes(query)) {
            return false
          }
        }

        return true
      })
      .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
  }, [transactions, activeOrganization, searchTerm, directionFilter, startDate, endDate])

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
          </div>

          {/* Search and Filters Section */}
          <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-white/6 bg-slate-50/50 p-4 dark:bg-slate-900/40 sm:grid-cols-4">
            {/* Search Input */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                {language === 'hi' ? 'खोजें' : language === 'mr' ? 'शोधा' : 'Search Details'}
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'hi' ? 'विवरण, श्रेणी या राशि खोजें...' : language === 'mr' ? 'तपशील, श्रेणी किंवा रक्कम शोधा...' : 'Search note, category, amount...'}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition"
              />
            </div>

            {/* Flow Type Filter */}
            <div>
              <label htmlFor="direction" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                {language === 'hi' ? 'प्रवाह प्रकार' : language === 'mr' ? 'प्रवाह प्रकार' : 'Flow Type'}
              </label>
              <select
                id="direction"
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition"
              >
                <option value="all">{language === 'hi' ? 'सभी प्रकार' : language === 'mr' ? 'सर्व प्रकार' : 'All Types'}</option>
                <option value="in">{language === 'hi' ? 'इनफ्लो' : language === 'mr' ? 'इनफ्लो' : 'Inflow'}</option>
                <option value="out">{language === 'hi' ? 'आउटफ्लो' : language === 'mr' ? 'आउटफ्लो' : 'Outflow'}</option>
              </select>
            </div>

            {/* Date Range Inputs */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                {language === 'hi' ? 'तारीख' : language === 'mr' ? 'दिनांक' : 'Date Range'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  aria-label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  aria-label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition"
                />
              </div>
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
                    // key={transaction.id || `${transaction.category || 'txn'}-${index}`}
                    key={transaction.id || `${translateCategoryLabel(language, transaction.category) || 'txn'}-${index}`}
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
                      <div className="flex-1 space-y-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-semibold text-slate-800">
                            {transaction.note?.trim() || capitalize(translateCategoryLabel(language, transaction.category) || text.transaction)}
                          </span>
                          {transaction.paymentMode && (
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              transaction.paymentMode === 'online'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-orange-50 text-orange-600'
                            }`}>
                              {transaction.paymentMode}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span>{formatDateTime(transaction.createdAt || transaction.date, locale)}</span>
                          {transaction.createdBy?.name && (
                            <span className="inline-flex items-center rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                              by: {transaction.createdBy.name}
                            </span>
                          )}
                          {(() => {
                            const att = resolveAttachmentPreview(transaction)
                            if (!att) return null
                            return (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setPreviewAttachment({
                                    ...transaction,
                                    attachmentName: att.name,
                                    attachmentType: att.type,
                                    attachmentDataUrl: att.dataUrl,
                                    ...att,
                                  })
                                }}
                                className="inline-flex items-center gap-1 ml-2 text-primary-600 hover:underline"
                              >
                                <PaperClipIcon className="h-3 w-3" />
                                attachment
                              </button>
                            )
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <span className={`text-base font-bold ${amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {amount >= 0 ? '+' : '-'} {formatMoney(Math.abs(amount), selectedCurrency, locale)}
                        </span>
                      </div>
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

      {previewAttachment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.attachmentPreview}</p>
                <h2 className="mt-1 text-lg font-light text-[var(--text)]">{previewAttachment.attachmentName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.dataUrl || previewAttachment.attachmentDataUrl}
                  download={previewAttachment.name || previewAttachment.attachmentName || 'download'}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  title="Download attachment"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label={text.closeAttachmentPreview}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-[var(--card)] p-5">
              {(() => {
                const dataUrl = previewAttachment.dataUrl || previewAttachment.attachmentDataUrl
                const type = previewAttachment.type || previewAttachment.attachmentType
                const isImage = type?.startsWith('image/') || dataUrl?.startsWith('data:image/')
                const isPdf = type === 'application/pdf' || dataUrl?.startsWith('data:application/pdf')

                if (!dataUrl) {
                  return (
                    <div className="rounded-2xl border border-dashed border-white/6 bg-[var(--card)] px-5 py-10 text-center text-sm text-slate-500">
                      {text.noAttachmentPreview}
                    </div>
                  )
                }

                if (isImage) {
                  return (
                    <img
                      src={dataUrl}
                      alt={previewAttachment.name || previewAttachment.attachmentName}
                      className="max-h-[70vh] w-full rounded-2xl object-contain"
                    />
                  )
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={dataUrl}
                      title={previewAttachment.name || previewAttachment.attachmentName}
                      className="h-[70vh] w-full rounded-2xl border border-slate-200"
                    />
                  )
                }

                return (
                  <div className="space-y-4 rounded-2xl border border-white/6 bg-[var(--card)] p-6 text-center">
                    <p className="text-sm font-light text-[var(--muted)]">{text.attachmentReadyMessage}</p>
                    <a
                      href={dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-3 text-sm font-light text-white transition hover:bg-primary-700"
                    >
                      {text.openAttachment}
                    </a>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}