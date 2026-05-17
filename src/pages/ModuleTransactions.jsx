import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PaperClipIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function loadOrganizations() {
  const storedOrganizations = readJSON('organizations', [])
  if (storedOrganizations.length > 0) {
    return storedOrganizations
  }

  const singleOrganization = readJSON('organization', null)
  if (singleOrganization) {
    return [{ ...singleOrganization, id: singleOrganization.id || Date.now().toString() }]
  }

  return []
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${Number(value || 0).toFixed(2)}`
  }
}

function formatTime(value) {
  if (!value) {
    return '--:--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDateLabel(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function ModuleTransactions() {
  const navigate = useNavigate()
  const { moduleName: encodedModuleName } = useParams()
  const moduleName = decodeURIComponent(encodedModuleName || '')
  const organizations = useMemo(() => loadOrganizations(), [])
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const transactions = useMemo(() => readJSON('transactions', []), [])
  const attachmentCache = useMemo(() => readJSON('attachments', []), [])
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [previewAttachment, setPreviewAttachment] = useState(null)

  const moduleData = activeOrganization?.modules?.find((module) => module.name === moduleName) || null

  const moduleTransactions = useMemo(() => {
    if (!activeOrganization || !moduleName) {
      return []
    }

    return transactions
      .filter((transaction) => {
        if (transaction.organizationId && transaction.organizationId !== activeOrganization.id) {
          return false
        }

        return transaction.module === moduleName && transaction.date === selectedDate
      })
      .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
  }, [transactions, activeOrganization, moduleName, selectedDate])

  const resolveAttachmentPreview = (transaction) => {
    if (transaction.attachmentDataUrl) {
      return {
        name: transaction.attachmentName,
        type: transaction.attachmentType,
        dataUrl: transaction.attachmentDataUrl,
      }
    }

    return attachmentCache.find((item) => item.transactionId === transaction.id) || null
  }

  if (!activeOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">No organization found</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Create an organization first to view module transactions.</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25">
            Create Organization
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to dashboard
          </button>

          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {moduleName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Module transactions</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{moduleName}</h1>
              <p className="mt-2 text-sm text-slate-500">See every transaction done under this module on the chosen date.</p>
            </div>

            <div className="w-full sm:w-auto">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-[220px]"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                <TagIcon className="h-4 w-4 text-blue-600" />
                {moduleData?.submodules?.length || 0} submodules
              </div>
              <div className="text-sm text-slate-500">{formatDateLabel(selectedDate)}</div>
            </div>

            <div className="space-y-3">
              {moduleTransactions.length > 0 ? (
                moduleTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-slate-900">{transaction.submodule || 'Unnamed submodule'}</p>
                        <p className="mt-1 text-sm text-slate-500">Module: {transaction.module}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold tracking-tight text-slate-900">{formatMoney(transaction.amount, selectedCurrency)}</p>
                        <p className="text-sm text-slate-500">{formatTime(transaction.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      {transaction.note ? <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{transaction.note}</span> : null}
                      {transaction.attachmentName ? (
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment({ ...transaction, ...resolveAttachmentPreview(transaction) })}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <PaperClipIcon className="h-4 w-4 text-slate-500" />
                          {transaction.attachmentName}
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  No transactions found for {moduleName} on {formatDateLabel(selectedDate)}.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {previewAttachment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Attachment preview</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{previewAttachment.attachmentName}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close attachment preview"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-5">
                {previewAttachment.dataUrl || previewAttachment.attachmentDataUrl ? (
                  (previewAttachment.type || previewAttachment.attachmentType)?.startsWith('image/') ? (
                    <img
                      src={previewAttachment.dataUrl || previewAttachment.attachmentDataUrl}
                      alt={previewAttachment.name || previewAttachment.attachmentName}
                      className="max-h-[75vh] w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center">
                      <p className="text-sm font-medium text-slate-600">This attachment is ready to open in a new tab.</p>
                      <a
                        href={previewAttachment.dataUrl || previewAttachment.attachmentDataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Open Attachment
                      </a>
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                    No preview data is available for this attachment yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}