// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PaperClipIcon, TagIcon, XMarkIcon, ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/outline'
import { authenticatedFetch } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations, loadTransactionsFromBackend } from '../../utils/organizationSync'
import translations, { translateText, getLocale, translateCategoryLabel, translateSubcategoryLabel } from '../../i18n/translations'
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

// Today's date as YYYY-MM-DD
// Function: getTodayDate
function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

// Format value as currency
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

// Format time for display
// Function: formatTime
function formatTime(value, locale = 'en-US') {
  if (!value) {
    return '--:--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// Format date label for UI
// Function: formatDateLabel
function formatDateLabel(value, locale = 'en-US') {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

// Determine transaction direction
// Function: getTransactionDirection
function getTransactionDirection(transaction) {
  if (transaction?.direction === 'in' || transaction?.direction === 'out') {
    return transaction.direction
  }

  if (transaction?.transactionDirection === 'in' || transaction?.transactionDirection === 'out') {
    return transaction.transactionDirection
  }

  if (transaction?.transactionType === 'revenue' || transaction?.transactionType === 'expense') {
    return transaction.transactionType === 'expense' ? 'out' : 'in'
  }

  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 'in'
  }

  return amount < 0 ? 'out' : 'in'
}

// Signed amount (in/out)
// Function: getSignedAmount
function getSignedAmount(transaction) {
  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 0
  }

  return getTransactionDirection(transaction) === 'out' ? -Math.abs(amount) : Math.abs(amount)
}


// Convert base64 string to Blob
// Function: base64ToBlob
function base64ToBlob(base64, contentType = 'application/pdf') {
  const binary = atob(base64)
  const chunks = []
  const chunkSize = 1024

  for (let index = 0; index < binary.length; index += chunkSize) {
    const slice = binary.slice(index, index + chunkSize)
    const bytes = new Uint8Array(slice.length)
    for (let offset = 0; offset < slice.length; offset += 1) {
      bytes[offset] = slice.charCodeAt(offset)
    }
    chunks.push(bytes)
  }

  return new Blob(chunks, { type: contentType })
}

// All transactions listing
export default function CategoryTransactions() {
  const navigate = useNavigate()
  const { categoryName: encodedCategoryName } = useParams()
  const categoryName = decodeURIComponent(encodedCategoryName || '')
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  
  // Reload organizations from localStorage on component mount to ensure fresh data
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

    const [transactions, setTransactions] = useState(() => readJSON('transactions', []))
    const [attachmentCache, setAttachmentCache] = useState(() => readJSON('attachments', []))

  useEffect(() => {
    // Function: handleStorage
    const handleStorage = (event) => {
      if (event.key === 'transactions' || event.key === 'attachments') {
        setTransactions(readJSON('transactions', []))
        setAttachmentCache(readJSON('attachments', []))
      }
    }

    window.addEventListener('storage', handleStorage)

    // Listen for app-level transactions updates
    // Function: updateTransactionsFromStorage
    const updateTransactionsFromStorage = () => {
      setTransactions(readJSON('transactions', []))
      setAttachmentCache(readJSON('attachments', []))
    }

    window.addEventListener('transactions:updated', updateTransactionsFromStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('transactions:updated', updateTransactionsFromStorage)
    }
  }, [])
  
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''

  useEffect(() => {
    if (activeOrgId) {
      loadTransactionsFromBackend(activeOrgId)
    }
  }, [activeOrgId])

  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const { language, text } = useLanguage()
  const locale = getLocale(language)
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [previewAttachment, setPreviewAttachment] = useState(null)

  const categoryData =
    activeOrganization?.categories?.find((category) => category.name === categoryName) ||
    activeOrganization?.categories?.find((category) => translateCategoryLabel(language, category.name) === categoryName) ||
    null

  const resolvedCategoryName = categoryData?.name || categoryName
  const displayCategoryName = translateCategoryLabel(language, resolvedCategoryName)

  const categoryTransactions = useMemo(() => {
    if (!activeOrganization || !categoryName) {
      return []
    }

    return transactions
      .filter((transaction) => {
        if (transaction.organizationId && transaction.organizationId !== activeOrganization.id) {
          return false
        }

        return transaction.category === resolvedCategoryName && transaction.date === selectedDate
      })
      .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
  }, [transactions, activeOrganization, resolvedCategoryName, selectedDate, language])

  // Function: resolveAttachmentPreview
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

  // Function: handleDownloadPDF
  const handleDownloadPDF = async () => {
    try {
      const response = await authenticatedFetch(
        `/transactions/report?organizationId=${encodeURIComponent(activeOrganization.id)}&category=${encodeURIComponent(categoryName)}&date=${encodeURIComponent(selectedDate)}`,
      )

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to download category report')
      }

      const reportData = payload?.data || {}
      if (!reportData.base64) {
        throw new Error('Category report data is empty')
      }

      const blob = base64ToBlob(reportData.base64, reportData.contentType || 'application/pdf')
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = reportData.filename || `${categoryName}-${selectedDate}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Failed to prepare PDF export'
      if (message.includes('session has expired')) {
        return
      }
      alert(message)
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
            {displayCategoryName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inner-card-accent rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/4 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">{text.categoryTransactionsTitle}</p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-[var(--text)]">{displayCategoryName}</h1>
              <p className="mt-2 text-sm text-slate-500">{text.categoryTransactionsDescription}</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-end sm:gap-4">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/add-transaction', { state: { preselectedCategory: resolvedCategoryName } })}
                  aria-label={text.addTransaction}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full accent-cta text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-sm font-light text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 sm:w-[220px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-light text-slate-700">
                <TagIcon className="h-4 w-4 text-primary-600" />
                {categoryData?.subcategories?.length || 0} {text.subcategories}
              </div>
              <div className="text-sm text-slate-500">{formatDateLabel(selectedDate, locale)}</div>
            </div>

            <div className="space-y-3">
              {categoryTransactions.length > 0 ? (
                categoryTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-light text-[var(--text)]">{transaction.subcategory ? translateSubcategoryLabel(language, transaction.subcategory) : text.unnamedSubcategory}</p>
                        <p className="mt-1 text-sm text-slate-500">{text.categoryLabelPrefix} {translateCategoryLabel(language, transaction.category)}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        {(() => {
                          const signedAmount = getSignedAmount(transaction)
                          const isExpense = getTransactionDirection(transaction) === 'out'
                          const amountColor = isExpense ? 'text-rose-600' : 'text-blue-600'
                          const amountSign = signedAmount < 0 ? '-' : signedAmount > 0 ? '+' : ''

                          return (
                            <p className={`inline-flex items-center gap-1 text-lg font-light tracking-tight ${amountColor}`}>
                              <span>{amountSign}</span>
                              <span>{formatMoney(Math.abs(signedAmount), selectedCurrency, locale)}</span>
                            </p>
                          )
                        })()}
                        <p className="text-sm text-slate-500">{formatTime(transaction.createdAt, locale)}</p>
                        {transaction.createdBy?.name && (
                          <span className="inline-flex items-center rounded bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] font-medium leading-none mt-1">
                            by: {transaction.createdBy.name}
                          </span>
                        )}
                      </div>

                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                      {transaction.note ? <span className="rounded-full bg-[var(--card)] px-3 py-1.5 ring-1 ring-slate-200">{transaction.note}</span> : null}
                      {(() => {
                        const att = resolveAttachmentPreview(transaction)
                        if (!att) return null
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewAttachment({
                                ...transaction,
                                attachmentName: att.name,
                                attachmentType: att.type,
                                attachmentDataUrl: att.dataUrl,
                                ...att,
                              })
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-primary-50 hover:text-primary-700"
                          >
                            <PaperClipIcon className="h-4 w-4 text-slate-500" />
                            {att.name}
                          </button>
                        )
                      })()}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/6 bg-[var(--card)] px-5 py-10 text-center text-sm text-slate-500">
                  {translateText(language, 'noTransactionsForCategory', { category: displayCategoryName, date: formatDateLabel(selectedDate) })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

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
    </div>
  )
}