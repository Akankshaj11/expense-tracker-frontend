import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, BuildingOffice2Icon, CalendarDaysIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { authenticatedFetch } from '../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../utils/organizationSync'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
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

function formatDateTime(value) {
  if (!value) {
    return 'No date'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'No date'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

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

function getTransactionDirection(transaction) {
  return getTransactionCategory(transaction) === 'expenses' ? 'out' : 'in'
}

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

function getTransactionEditPath(transaction) {
  const transactionId = String(transaction?.id || transaction?._id || '')
  return transactionId ? `/edit-transaction/${encodeURIComponent(transactionId)}` : '/add-transaction'
}

export default function Transactions() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())

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
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const transactions = useMemo(() => readJSON('transactions', []), [])

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

  const revenueValue = organizationTransactions.reduce((sum, transaction) => {
    return getTransactionCategory(transaction) === 'revenue' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const expensesValue = organizationTransactions.reduce((sum, transaction) => {
    return getTransactionCategory(transaction) === 'expenses' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const investmentsValue = organizationTransactions.reduce((sum, transaction) => {
    return getTransactionCategory(transaction) === 'investments' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const totalTransactionsValue = revenueValue - expensesValue

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
        throw new Error(payload?.message || 'Failed to download report')
      }

      const payload = await response.json()
      const reportData = payload?.data || {}
      const base64Pdf = reportData.base64 || ''

      if (!base64Pdf) {
        throw new Error('Failed to download report')
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
      alert('Failed to download Workspace report')
    }
  }

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center bg-[var(--card)] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <h1 className="text-3xl font-light tracking-tight text-[var(--text)]">No organization found</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">Create an organization first to view transactions.</p>
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
            All transactions
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/4 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Organization transactions</p>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-[var(--text)]">{activeOrganization.organizationName}</h1>
              <p className="mt-2 text-sm text-slate-500">A full list of every transaction in this organization.</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:justify-end sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                Add transaction
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-5 py-3 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download report
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total balance', value: formatMoney(Math.abs(totalTransactionsValue), selectedCurrency), tone: totalTransactionsValue >= 0 ? 'text-emerald-600' : 'text-rose-600', sign: totalTransactionsValue >= 0 ? '+' : '-' },
              { label: 'Revenue', value: formatMoney(revenueValue, selectedCurrency), tone: 'text-emerald-600', sign: '+' },
              { label: 'Expenses', value: formatMoney(expensesValue, selectedCurrency), tone: 'text-rose-600', sign: '-' },
              { label: 'Investments', value: formatMoney(investmentsValue, selectedCurrency), tone: 'text-violet-600', sign: '+' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 shadow-sm">
                <p className="text-sm font-light text-slate-500">{item.label}</p>
                <p className={`mt-2 text-2xl font-light tracking-tight ${item.tone}`}>
                  <span>{item.sign}</span> {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
              <BuildingOffice2Icon className="h-4 w-4" />
              {organizationTransactions.length} transactions
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-light text-violet-700">
              <CalendarDaysIcon className="h-4 w-4" />
              Latest first
            </div>
          </div>

          {organizationTransactions.length > 0 ? (
            <div className="mt-6 space-y-3">
              {organizationTransactions.map((transaction, index) => {
                const amount = getSignedTransactionAmount(transaction)
                const editPath = getTransactionEditPath(transaction)

                return (
                  <Link
                    key={transaction.id || `${transaction.module || 'txn'}-${index}`}
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
                        <p className="font-light text-[var(--text)]">{transaction.note?.trim() || `${capitalize(transaction.module || 'Transaction')} update`}</p>
                        <p className="text-sm text-slate-500">
                          {capitalize(transaction.module || 'Transaction')} · {formatDateTime(transaction.createdAt || transaction.date)}
                        </p>
                      </div>
                      <p className={`text-sm font-light ${amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {amount >= 0 ? '+' : '-'}{formatMoney(Math.abs(amount), selectedCurrency)}
                      </p>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-[var(--card)] px-4 py-6 text-sm text-slate-500">
              No transactions found for this organization yet.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}