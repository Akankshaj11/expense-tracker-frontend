import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { apiRequest, authenticatedFetch } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations, loadTransactionsFromBackend } from '../../utils/organizationSync'
import translations, { translateText, getLocale } from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'
import UpgradeModal from '../../components/common/UpgradeModal'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function formatMoney(value, currency, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${Number(value || 0).toLocaleString()}`
  }
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr // e.g. "14:30"
}

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default function BookTransactions() {
  const navigate = useNavigate()
  const { bookName: encodedBookName } = useParams()
  const bookName = decodeURIComponent(encodedBookName || '')
  
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  const [transactions, setTransactions] = useState(() => readJSON('transactions', []))
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // all, today, this_week, this_month, this_year, date_range
  const [typeFilter, setTypeFilter] = useState('all') // all, in, out
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [showRangeModal, setShowRangeModal] = useState(false)
  const [previousDateFilter, setPreviousDateFilter] = useState('all')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  const handleDateFilterChange = (val) => {
    if (val === 'date_range') {
      setPreviousDateFilter(dateFilter)
      setDateFilter('date_range')
      setShowRangeModal(true)
    } else {
      setDateFilter(val)
    }
  }

  const handleCloseRangeModal = () => {
    setShowRangeModal(false)
    setDateFilter(previousDateFilter)
  }

  const handleApplyRangeModal = () => {
    setShowRangeModal(false)
  }
  
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  
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
  
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const { language, text } = useLanguage()
  const locale = getLocale(language)
  
  const loadTransactionsData = async () => {
    setIsLoading(true)
    if (activeOrgId) {
      await loadTransactionsFromBackend(activeOrgId)
    }
    setTransactions(readJSON('transactions', []))
    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactionsData()
  }, [activeOrgId])

  useEffect(() => {
    const handleTransactionsUpdated = () => {
      setTransactions(readJSON('transactions', []))
    }
    window.addEventListener('transactions:updated', handleTransactionsUpdated)
    return () => {
      window.removeEventListener('transactions:updated', handleTransactionsUpdated)
    }
  }, [])

  // Filter transactions belonging to this book
  const bookTransactions = useMemo(() => {
    if (!activeOrganization) return []
    return transactions.filter(
      (t) => t.organizationId === activeOrganization.id && t.book === bookName
    )
  }, [transactions, activeOrganization, bookName])

  // Apply search and filter logic
  const filteredTransactions = useMemo(() => {
    let result = [...bookTransactions]

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) => (t.note || '').toLowerCase().includes(q)
      )
    }

    // Type filter
    if (typeFilter === 'in') {
      result = result.filter((t) => t.direction === 'in')
    } else if (typeFilter === 'out') {
      result = result.filter((t) => t.direction === 'out')
    }

    // Date filter
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    result = result.filter((t) => {
      if (!t.date) return true
      const tDate = new Date(t.date)
      if (isNaN(tDate.getTime())) return true

      switch (dateFilter) {
        case 'today':
          return tDate.toDateString() === now.toDateString()
        case 'this_week': {
          const startOfWeek = new Date(startOfToday)
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()) // Sunday
          return tDate >= startOfWeek
        }
        case 'this_month':
          return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth()
        case 'this_year':
          return tDate.getFullYear() === now.getFullYear()
        case 'date_range': {
          if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            if (tDate < start) return false
          }
          if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (tDate > end) return false
          }
          return true
        }
        case 'all':
        default:
          return true
      }
    })

    // Sort chronologically ascending to calculate running balance, then reverse for display (newest first)
    return result.sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))
  }, [bookTransactions, searchQuery, typeFilter, dateFilter, startDate, endDate])

  // Calculate Running Balances chronologically
  const runningBalances = useMemo(() => {
    const balances = {}
    let currentBal = 0
    filteredTransactions.forEach((t) => {
      const amount = Number(t.amount || 0)
      if (t.direction === 'in') {
        currentBal += amount
      } else {
        currentBal -= amount
      }
      balances[t.id || t._id] = currentBal
    })
    return balances
  }, [filteredTransactions])

  // Display transactions sorted newest first
  const displayTransactions = useMemo(() => {
    return [...filteredTransactions].reverse()
  }, [filteredTransactions])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {}
    displayTransactions.forEach((t) => {
      const dateLabel = formatDateLabel(t.date)
      if (!groups[dateLabel]) {
        groups[dateLabel] = []
      }
      groups[dateLabel].push(t)
    })
    return groups
  }, [displayTransactions])

  // Summary Metrics
  const totalIn = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.direction === 'in')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  }, [filteredTransactions])

  const totalOut = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.direction === 'out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  }, [filteredTransactions])

  const netBalance = totalIn - totalOut

  // Download Report PDF
  const handleDownloadReport = async () => {
    setMenuOpen(false)
    if (!activeOrganization) return
    try {
      const response = await authenticatedFetch(
        `/dashboard/report?organizationId=${encodeURIComponent(activeOrganization.id)}&book=${encodeURIComponent(bookName)}`,
        { method: 'GET' }
      )
      if (!response.ok) {
        throw new Error(text.downloadReportFailed || 'Failed to download report')
      }
      const payload = await response.json()
      const reportData = payload?.data || {}
      const base64Pdf = reportData.base64 || ''
      if (!base64Pdf) throw new Error('No pdf data found')

      const binaryString = atob(base64Pdf)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const pdfBlob = new Blob([bytes], { type: reportData.contentType || 'application/pdf' })
      const downloadUrl = URL.createObjectURL(pdfBlob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = reportData.filename || `${bookName.toLowerCase().replace(/\s+/g, '_')}_report.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error(err)
      alert(text.downloadReportFailed || 'Unable to download report')
    }
  }

  // Delete All Entries
  const handleDeleteAllEntries = async () => {
    setMenuOpen(false)
    const confirmMsg = translateText(language, 'deleteAllEntriesConfirmation', { book: bookName })
    if (!window.confirm(confirmMsg)) {
      return
    }
    setIsLoading(true)
    try {
      for (const t of bookTransactions) {
        const isMongoId = /^[a-f0-9]{24}$/.test(t.id || t._id)
        if (isMongoId) {
          await apiRequest(`/transactions/${t.id || t._id}`, {
            method: 'DELETE',
          })
        }
      }
      // Clear locally
      const localTxns = readJSON('transactions', [])
      const nextTxns = localTxns.filter(
        (t) => !(t.organizationId === activeOrgId && t.book === bookName)
      )
      localStorage.setItem('transactions', JSON.stringify(nextTxns))
      window.dispatchEvent(new Event('transactions:updated'))
    } catch (e) {
      console.error(e)
      alert(text.deleteAllEntriesFailed || 'Failed to delete some entries')
    } finally {
      setIsLoading(false)
    }
  }

  // Add transaction wrapper
  const handleAddTransaction = (direction) => {
    // Store selected book as active
    localStorage.setItem('activeBookName_' + activeOrgId, bookName)
    navigate('/add-transaction', { state: { preselectedDirection: direction } })
  }

  return (
    <div className="theme-light-violet min-h-screen text-[var(--text)] pb-24">
      {/* Top Navbar */}
      <nav className="fixed inset-x-0 top-0 z-40 bg-primary-600 px-6 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full p-2 hover:bg-primary-700 transition"
              aria-label="Back to Dashboard"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight">{bookName}</h1>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full p-2 hover:bg-primary-700 transition"
              aria-label="More actions"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 z-20 w-48 origin-top-right rounded-2xl bg-white p-2 text-slate-800 shadow-xl border border-slate-100">
                  <button
                    onClick={handleDownloadReport}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-primary-600" />
                    {text.downloadReport}
                  </button>
                  <button
                    onClick={handleDeleteAllEntries}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {text.deleteAllEntries}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 pt-24">
        {/* Three Cards in a Row: Net Balance, Total In, Total Out */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <span className="text-[11px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider block">{text.netBalance}</span>
            <span className={`text-sm md:text-base font-extrabold block mt-1.5 truncate ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(netBalance, selectedCurrency, locale)}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <span className="text-[11px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider block">{text.totalIn}</span>
            <span className="text-sm md:text-base font-extrabold text-emerald-600 block mt-1.5 truncate">
              {formatMoney(totalIn, selectedCurrency, locale)}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <span className="text-[11px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider block">{text.totalOut}</span>
            <span className="text-sm md:text-base font-extrabold text-rose-600 block mt-1.5 truncate">
              {formatMoney(totalOut, selectedCurrency, locale)}
            </span>
          </div>
        </div>

        {/* Search & Filters Panel (Search left, filters right side) */}
        <div className="mt-5 space-y-3 px-1">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search bar on the left (increased width/height, white background) */}
            <div className="relative w-full md:w-[420px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={text.searchBooks || "Search entries..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-primary-500 transition"
              />
            </div>

            {/* Both filter buttons on the right side, reduced width, increased height to align */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-3 w-1/2 md:w-[155px] flex-shrink-0">
                <CalendarDaysIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">{text.allDates}</option>
                  <option value="today">{text.today}</option>
                  <option value="this_week">{text.thisWeek}</option>
                  <option value="this_month">{text.thisMonth}</option>
                  <option value="this_year">{text.thisYear}</option>
                  <option value="date_range">{text.range}</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-3 w-1/2 md:w-[110px] flex-shrink-0">
                <FunnelIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">{text.allCategoriesLabel ? text.allCategoriesLabel.split(' ')[0] : 'All'}</option>
                  <option value="in">{text.in}</option>
                  <option value="out">{text.out}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="mt-8 text-center text-slate-400 py-12">
            {text.noTransactionsFoundForBook}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {Object.keys(groupedTransactions).map((dateLabel) => (
              <div key={dateLabel} className="space-y-2">
                {/* Group Header */}
                <h3 className="text-sm font-semibold tracking-wide text-primary-600 px-1 py-1 rounded-lg bg-primary-50/50 inline-block">
                  {dateLabel}
                </h3>

                {/* Group Items */}
                <div className="space-y-2">
                  {groupedTransactions[dateLabel].map((t) => {
                    const isIncome = t.direction === 'in'
                    const balanceAtTxn = runningBalances[t.id || t._id] || 0
                    const currentUser = readJSON('currentUser', {})

                    return (
                      <motion.div
                        key={t.id || t._id}
                        onClick={() => navigate(`/edit-transaction/${encodeURIComponent(t.id || t._id)}`)}
                        className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/6 bg-[var(--card)] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex-1 space-y-1 pr-4">
                          <div className="flex items-center gap-2 flex-wrap text-left">
                            <span className="text-base font-medium text-slate-800">
                              {t.note || 'No description'}
                            </span>
                            {t.paymentMode && (
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                t.paymentMode === 'online'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-orange-50 text-orange-600'
                              }`}>
                                {t.paymentMode}
                              </span>
                            )}
                            {currentUser?.plan_id && currentUser.plan_id !== 'free' && t.subcategory && (
                              <span className="inline-flex items-center rounded bg-violet-50 text-violet-650 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                {t.subcategory}
                              </span>
                            )}
                            {t.isPendingBill && t.status !== 'paid' && (
                              <>
                                <span className="inline-flex items-center rounded bg-amber-50 text-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  Pending
                                </span>
                                <button
                                  type="button"
                                  onClick={async (event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    try {
                                      try {
                                        const localTxns = JSON.parse(localStorage.getItem('transactions') || '[]')
                                        const idx = localTxns.findIndex(txn => String(txn.id || txn._id) === String(t.id || t._id))
                                        if (idx !== -1) {
                                          localTxns[idx].status = 'paid'
                                          localStorage.setItem('transactions', JSON.stringify(localTxns))
                                        }
                                        const dismissals = JSON.parse(localStorage.getItem('dismissedAlerts') || '{}')
                                        delete dismissals[t.id || t._id]
                                        localStorage.setItem('dismissedAlerts', JSON.stringify(dismissals))
                                      } catch {}
                                      window.dispatchEvent(new Event('transactions:updated'))

                                      await authenticatedFetch(`/transactions/${t.id || t._id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'paid' })
                                      })
                                      const activeOrgId = localStorage.getItem('activeOrgId') || ''
                                      if (activeOrgId) {
                                        await loadTransactionsFromBackend(activeOrgId)
                                      }
                                      alert('Bill marked as paid!')
                                    } catch (err) {
                                      alert('Failed to mark as paid')
                                    }
                                  }}
                                  className="inline-flex items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ml-1"
                                >
                                  Mark Paid
                                </button>
                              </>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>{formatTime(t.time)}</span>
                            {t.createdBy?.name && (
                              <span className="inline-flex items-center rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                                by: {t.createdBy.name}
                              </span>
                            )}
                            {t.attachmentDataUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const currentUser = readJSON('currentUser', {})
                                  if (currentUser.plan_id === 'free' || !currentUser.plan_id) {
                                    setUpgradeMessage('Receipt Preview: Interactive previewing of bill/receipt attachments is a Pro workspace feature. Upgrade your workspace to Professional to view receipts.')
                                    setShowUpgradeModal(true)
                                  } else {
                                    setPreviewAttachment({
                                      url: t.attachmentDataUrl,
                                      name: t.attachmentName || 'Attachment',
                                      type: t.attachmentType
                                    })
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                              >
                                <PaperClipIcon className="h-3 w-3" />
                                attachment
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <span className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'} {formatMoney(t.amount, selectedCurrency, locale)}
                          </span>
                          <span className="text-xs text-slate-400">
                            Bal: {formatMoney(balanceAtTxn, selectedCurrency, locale)}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Floating/Fixed Bar for Quick Add */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-30">
        <div className="mx-auto flex max-w-xl gap-4">
          <button
            onClick={() => handleAddTransaction('in')}
            className="flex-1 rounded-2xl bg-emerald-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition"
          >
            IN
          </button>
          <button
            onClick={() => handleAddTransaction('out')}
            className="flex-1 rounded-2xl bg-rose-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-rose-600/10 hover:bg-rose-700 transition"
          >
            OUT
          </button>
        </div>
      </div>

      {/* Attachment Preview & Date Range Modals */}
      <AnimatePresence>
        {previewAttachment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold text-slate-800 pr-10 truncate mb-4">
                {previewAttachment.name}
              </h3>
              <div className="flex items-center justify-center min-h-[300px] border border-slate-100 rounded-2xl bg-slate-50 overflow-auto">
                {previewAttachment.type?.startsWith('image/') || previewAttachment.url?.startsWith('data:image/') ? (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <PaperClipIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="text-sm text-slate-600">Attachment preview is not supported for this file type.</p>
                    <a
                      href={previewAttachment.url}
                      download={previewAttachment.name}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800">{text.selectDateRange}</h3>
                <button
                  onClick={handleCloseRangeModal}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{text.startDate}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-primary-500 transition cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{text.endDate}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-primary-500 transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRangeModal}
                  className="flex-1 py-3 text-center text-sm font-bold rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleApplyRangeModal}
                  className="flex-1 py-3 text-center text-sm font-bold rounded-2xl bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/10 transition"
                >
                  {text.applyFilter}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
    </div>
  )
}
