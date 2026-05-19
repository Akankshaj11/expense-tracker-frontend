import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PaperClipIcon, TagIcon, XMarkIcon, ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/outline'

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

function getTransactionDirection(transaction) {
  if (transaction?.transactionDirection === 'in' || transaction?.transactionDirection === 'out') {
    return transaction.transactionDirection
  }

  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 'in'
  }

  return amount < 0 ? 'out' : 'in'
}

function getSignedAmount(transaction) {
  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 0
  }

  return getTransactionDirection(transaction) === 'out' ? -Math.abs(amount) : Math.abs(amount)
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

  const handleDownloadPDF = () => {
    try {
      const rows = moduleTransactions.map((t) => {
        const signedAmount = getSignedAmount(t)
        return {
          id: t.id,
          date: t.date || t.createdAt || '',
          time: formatTime(t.createdAt),
          module: t.module,
          submodule: t.submodule || '',
          amount: `${signedAmount < 0 ? '-' : signedAmount > 0 ? '+' : ''}${formatMoney(Math.abs(signedAmount), selectedCurrency)}`,
          note: t.note || '',
          attachmentName: t.attachmentName || '',
        }
      })

      const tableRows = rows.map(r => `
        <tr>
          <td>${r.id}</td>
          <td>${new Date(r.date).toLocaleDateString()}</td>
          <td>${r.time}</td>
          <td>${r.module}</td>
          <td>${r.submodule}</td>
          <td style="text-align:right">${r.amount}</td>
          <td>${r.note}</td>
          <td>${r.attachmentName}</td>
        </tr>
      `).join('')

      const doc = `
        <html>
          <head>
            <title>Transactions - ${moduleName} - ${selectedDate}</title>
            <style>
              body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding:20px; color:#0f172a }
              h1 { font-size:18px; margin-bottom:6px }
              table { width:100%; border-collapse:collapse; margin-top:12px }
              th, td { border:1px solid #e6edf3; padding:8px; font-size:12px }
              th { background:#f8fafc; text-align:left }
            </style>
          </head>
          <body>
            <h1>Transactions — ${moduleName} — ${formatDateLabel(selectedDate)}</h1>
            <div>Exported from FinTrack</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Date</th><th>Time</th><th>Module</th><th>Submodule</th><th>Amount</th><th>Note</th><th>Attachment</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <script>window.onload = function(){ setTimeout(()=>{ window.print(); setTimeout(()=>{ window.close() }, 300) }, 120) }</script>
          </body>
        </html>
      `

      const w = window.open('', '_blank')
      if (!w) {
        alert('Popup blocked. Please allow popups to download the PDF via print.')
        return
      }
      w.document.open()
      w.document.write(doc)
      w.document.close()
    } catch (err) {
      console.error(err)
      alert('Failed to prepare PDF export')
    }
  }

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center bg-[var(--card)] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <h1 className="text-3xl font-light tracking-tight text-[var(--text)]">No organization found</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">Create an organization first to view module transactions.</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25">
            Create Organization
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-light-violet min-h-screen bg-[var(--card)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to dashboard
          </button>

          <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
            {moduleName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/4 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Module transactions</p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-[var(--text)]">{moduleName}</h1>
              <p className="mt-2 text-sm text-slate-500">See every transaction done under this module on the chosen date.</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-end sm:gap-4">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/add-transaction')}
                  aria-label="Add transaction"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-sm font-light text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 sm:w-[220px]"
                />
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-light text-slate-700">
                <TagIcon className="h-4 w-4 text-primary-600" />
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
                    className="rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-light text-[var(--text)]">{transaction.submodule || 'Unnamed submodule'}</p>
                        <p className="mt-1 text-sm text-slate-500">Module: {transaction.module}</p>
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
                              <span>{formatMoney(Math.abs(signedAmount), selectedCurrency)}</span>
                            </p>
                          )
                        })()}
                        <p className="text-sm text-slate-500">{formatTime(transaction.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                      {transaction.note ? <span className="rounded-full bg-[var(--card)] px-3 py-1.5 ring-1 ring-slate-200">{transaction.note}</span> : null}
                      {transaction.attachmentName ? (
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment({ ...transaction, ...resolveAttachmentPreview(transaction) })}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-primary-50 hover:text-primary-700"
                        >
                          <PaperClipIcon className="h-4 w-4 text-slate-500" />
                          {transaction.attachmentName}
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/6 bg-[var(--card)] px-5 py-10 text-center text-sm text-slate-500">
                  No transactions found for {moduleName} on {formatDateLabel(selectedDate)}.
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
                  <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">Attachment preview</p>
                  <h2 className="mt-1 text-lg font-light text-[var(--text)]">{previewAttachment.attachmentName}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Close attachment preview"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-[var(--card)] p-5">
                {previewAttachment.dataUrl || previewAttachment.attachmentDataUrl ? (
                  (previewAttachment.type || previewAttachment.attachmentType)?.startsWith('image/') ? (
                    <img
                      src={previewAttachment.dataUrl || previewAttachment.attachmentDataUrl}
                      alt={previewAttachment.name || previewAttachment.attachmentName}
                      className="max-h-[75vh] w-full rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="space-y-4 rounded-2xl border border-white/6 bg-[var(--card)] p-6 text-center">
                      <p className="text-sm font-light text-[var(--muted)]">This attachment is ready to open in a new tab.</p>
                      <a
                        href={previewAttachment.dataUrl || previewAttachment.attachmentDataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-3 text-sm font-light text-white transition hover:bg-primary-700"
                      >
                        Open Attachment
                      </a>
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/6 bg-[var(--card)] px-5 py-10 text-center text-sm text-slate-500">
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