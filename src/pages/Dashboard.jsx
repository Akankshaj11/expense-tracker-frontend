import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowsRightLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronDownIcon,
  CircleStackIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  Squares2X2Icon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
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

function deriveFirstName(user) {
  const raw = user?.firstName || user?.name || user?.email?.split('@')[0] || 'there'
  return raw.split(/[._-]/)[0].replace(/^[a-z]/, (letter) => letter.toUpperCase())
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${value.toLocaleString()}`
  }
}

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

function getSignedTransactionAmount(transaction) {
  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 0
  }

  return getTransactionDirection(transaction) === 'out' ? -Math.abs(amount) : Math.abs(amount)
}

const moduleThemes = {
  lend: { label: 'Lend', bg: '#fcf5ff', fg: '#7A0099', iconBg: '#fae8ff', icon: BanknotesIcon },
  borrow: { label: 'Borrow', bg: '#FFF7ED', fg: '#EA580C', iconBg: '#FFEDD5', icon: ArrowsRightLeftIcon },
  savings: { label: 'Savings', bg: '#ECFDF5', fg: '#059669', iconBg: '#D1FAE5', icon: CircleStackIcon },
  investments: { label: 'Investments', bg: '#F5F3FF', fg: '#7C3AED', iconBg: '#EDE9FE', icon: ChartBarIcon },
  custom: { label: 'Custom', bg: '#F8FAFC', fg: '#0F172A', iconBg: '#E2E8F0', icon: Squares2X2Icon },
}

function getModuleSubmodules(module, organization) {
  if (Array.isArray(module?.submodules)) {
    return module.submodules
  }

  if (module?.name && Array.isArray(organization?.submodules?.[module.name])) {
    return organization.submodules[module.name]
  }

  return []
}

function buildModuleCards(activeOrganization, currency, transactions) {
  if (!activeOrganization?.modules?.length) {
    return []
  }

  const moduleAmounts = activeOrganization.modules.map((module) => {
    const normalizedName = module.name.toLowerCase()
    const theme = moduleThemes[normalizedName] || moduleThemes.custom
    const amount = (transactions || [])
      .filter((transaction) => transaction.module === module.name)
      .reduce((sum, transaction) => sum + getSignedTransactionAmount(transaction), 0)

    return {
      label: module.name,
      submodules: getModuleSubmodules(module, activeOrganization),
      amount,
      theme,
    }
  })

  const maxAmount = moduleAmounts.reduce((max, item) => Math.max(max, Math.abs(item.amount)), 0)

  return moduleAmounts.map((item, index) => {
    const fill = maxAmount > 0 ? Math.min(92, Math.max(0, Math.round((Math.abs(item.amount) / maxAmount) * 92))) : 0

    return {
      id: `${item.label}-${index}`,
      label: item.label,
      submodules: item.submodules,
      amountValue: item.amount,
      amount: formatMoney(Math.abs(item.amount), currency),
      theme: item.theme,
      fill,
    }
  })
}

function buildRecentActivity(transactions, currency) {
  return [...(transactions || [])]
    .filter((transaction) => Number.isFinite(Number(transaction?.amount)))
    .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
    .slice(0, 4)
    .map((transaction, idx) => {
      const amount = getSignedTransactionAmount(transaction)
      const activityTime = transaction.createdAt || transaction.date || ''
      const metaDate = activityTime
        ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(activityTime))
        : 'No date'

      return {
        id: transaction.id || `${transaction.module || 'txn'}-${idx}`,
        title: transaction.note?.trim() || `${capitalize(transaction.module || 'Transaction')} update`,
        meta: `${capitalize(transaction.module || 'Dashboard')} · ${metaDate}`,
        amount: amount >= 0 ? formatMoney(amount, currency) : `-${formatMoney(Math.abs(amount), currency)}`,
        tone: amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
      }
    })
}

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('activeOrgId') || readCachedOrganizations()[0]?.id || '')
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const currentUser = readJSON('currentUser', null)
  const selectedCurrency = readJSON('selectedCurrency', { code: 'USD', symbol: '$' })

  useEffect(() => {
    let cancelled = false

    loadOrganizationsFromBackend().then((refreshedOrganizations) => {
      if (cancelled) {
        return
      }

      setOrganizations(refreshedOrganizations)
      setActiveOrgId(localStorage.getItem('activeOrgId') || refreshedOrganizations[0]?.id || '')
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('organizations', JSON.stringify(organizations))
  }, [organizations])

  useEffect(() => {
    if (activeOrgId) {
      localStorage.setItem('activeOrgId', activeOrgId)
    }
  }, [activeOrgId])

  const activeOrganization = useMemo(() => {
    return organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  }, [organizations, activeOrgId])

  const activeCurrency = activeOrganization?.currency || selectedCurrency
  const transactions = readJSON('transactions', [])
  const activeOrganizationTransactions = useMemo(() => {
    if (!activeOrganization) {
      return []
    }

    return transactions.filter((transaction) => {
      if (transaction.organizationId && transaction.organizationId !== activeOrganization.id) {
        return false
      }

      return true
    })
  }, [transactions, activeOrganization])
  const firstName = deriveFirstName(currentUser)
  const moduleCards = buildModuleCards(activeOrganization, activeCurrency, activeOrganizationTransactions)
  const recentActivity = buildRecentActivity(activeOrganizationTransactions, activeCurrency)

  const revenueAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getTransactionDirection(transaction) === 'in' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const expensesAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getTransactionDirection(transaction) === 'out' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const totalBalanceValue = revenueAmountValue - expensesAmountValue

  const totalBalance = formatMoney(totalBalanceValue, activeCurrency)
  const revenueAmount = formatMoney(revenueAmountValue, activeCurrency)
  const expensesAmount = formatMoney(expensesAmountValue, activeCurrency)

  const handleSwitchOrg = (organizationId) => {
    setActiveOrgId(organizationId)
    setOrgMenuOpen(false)
    setProfileOpen(false)
  }

  const handleCreateNewOrg = () => {
    setOrgMenuOpen(false)
    navigate('/create-organization')
  }

  const handleManageOrg = () => {
    setOrgMenuOpen(false)
    navigate('/manage-organization')
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('authToken')
      localStorage.removeItem('activeOrgId')
    } catch {}
    setProfileOpen(false)
    navigate('/login')
  }

  const handleDownloadWorkspacePDF = async () => {
    try {
      const response = await authenticatedFetch(`/dashboard/report?organizationId=${encodeURIComponent(activeOrganization.id)}`, {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 401) {
          return
        }

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
      if (err?.message !== 'Your session has expired. Please login again.') {
        alert('Failed to download Workspace report')
      }
    }
  }

  return (
    <div className="theme-light-violet min-h-screen bg-[var(--card)] text-[var(--text)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/6/80 bg-[var(--card)]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 font-light text-white shadow-lg shadow-primary-500/20">
                FT
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">FinTrack</p>
                <p className="text-lg font-light text-[var(--text)]">Wallet App</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOrgMenuOpen((current) => !current)
                    setProfileOpen(false)
                  }}
                  className="inline-flex items-center gap-3 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <BuildingOffice2Icon className="h-4 w-4 text-primary-600" />
                  <span className="max-w-[130px] truncate sm:max-w-[180px]">
                    {activeOrganization?.organizationName || 'No organization'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {orgMenuOpen ? (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-white/6 bg-[var(--card)] shadow-2xl shadow-slate-200/80">
                    <div className="border-b border-white/4 px-4 py-3">
                      <p className="text-sm font-light text-[var(--text)]">Organizations</p>
                      <p className="text-xs text-slate-500">Switch between workspace organizations</p>
                    </div>
                    <div className="max-h-64 overflow-auto p-2">
                      {organizations.length > 0 ? (
                        organizations.map((organization) => (
                          <button
                            key={organization.id}
                            type="button"
                            onClick={() => handleSwitchOrg(organization.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-primary-50 ${
                              activeOrgId === organization.id ? 'bg-primary-50' : 'bg-transparent'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-light text-[var(--text)]">{organization.organizationName}</p>
                              <p className="text-xs text-slate-500">{organization.description || 'No description'}</p>
                            </div>
                            {activeOrgId === organization.id ? <span className="rounded-full bg-primary-600 px-2 py-1 text-[10px] font-light text-white">Active</span> : null}
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl bg-[var(--card)] px-3 py-4 text-sm text-slate-500">No organizations found</div>
                      )}
                    </div>
                    <div className="border-t border-white/4 p-2">
                      <button
                        type="button"
                        onClick={handleCreateNewOrg}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-light text-primary-700 transition hover:bg-primary-50"
                      >
                        Create new organization
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((current) => !current)
                    setOrgMenuOpen(false)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/6 bg-[var(--card)] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label="Open profile details"
                >
                  <UserCircleIcon className="h-6 w-6 text-[var(--muted)]" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/6 bg-[var(--card)] p-4 shadow-2xl shadow-slate-200/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-light text-white">
                        {firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-light text-[var(--text)]">{firstName}</p>
                        <p className="text-xs text-slate-500">{currentUser?.email || 'No email found'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 rounded-2xl bg-[var(--card)] p-3 text-sm text-[var(--muted)]">
                      <div className="flex items-center justify-between">
                        <span>Organization</span>
                        <span className="font-light text-[var(--text)]">{activeOrganization?.organizationName || 'None'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Currency</span>
                        <span className="font-light text-[var(--text)]">{activeCurrency?.code || 'USD'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Workspace status</span>
                        <span className="inline-flex items-center gap-1 font-light text-emerald-600">
                          <ShieldCheckIcon className="h-4 w-4" />
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-white/4 pt-3">
                      <button type="button" onClick={handleLogout} className="w-full rounded-xl px-3 py-3 text-left text-sm font-light text-rose-600 transition hover:bg-rose-50">
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <section className="rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-light uppercase tracking-[0.26em] text-primary-600">Dashboard</p>
              <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">
                Good afternoon, {firstName}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                You are viewing {activeOrganization?.organizationName || 'your workspace'}{activeOrganization?.description ? ` · ${activeOrganization.description}` : ''}.
              </p>
            </div>

            <div className="flex flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                Add Transaction
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/manage-organization')}
                className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-5 py-3 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Manage Organization
                <BuildingOffice2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {activeOrganization ? (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[
                { label: 'Total balance', value: totalBalance, accent: 'text-[var(--text)]' },
                { label: 'Revenue', value: revenueAmount, accent: 'text-emerald-600' },
                { label: 'Expenses', value: expensesAmount, accent: 'text-rose-600' },
              ].map((card, index) => {
                const isBalanceCard = card.label === 'Total balance'
                const isNegativeBalance = isBalanceCard && totalBalanceValue < 0
                const isPositiveBalance = isBalanceCard && totalBalanceValue > 0
                const isZeroBalance = isBalanceCard && totalBalanceValue === 0
                const DisplayArrow = card.label === 'Expenses' || isNegativeBalance ? ArrowTrendingDownIcon : ArrowTrendingUpIcon
                const displayAccent = isBalanceCard
                  ? isPositiveBalance
                    ? 'text-emerald-600'
                    : isNegativeBalance
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  : card.accent
                const displaySign = isBalanceCard
                  ? isPositiveBalance
                    ? '+'
                    : isNegativeBalance
                      ? '-'
                      : ''
                  : card.label === 'Revenue'
                    ? '+'
                    : card.label === 'Expenses'
                      ? '-'
                      : ''
                const displayValue = isBalanceCard ? formatMoney(Math.abs(totalBalanceValue), activeCurrency) : card.value

                return (
                  <motion.article
                    key={card.label}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ delay: index * 0.06, duration: 0.45 }}
                    className="rounded-[1.75rem] border border-white/6 bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <p className="text-sm font-light text-slate-500">{card.label}</p>
                      <p className={`mt-1 inline-flex items-center gap-1 text-3xl font-light tracking-tight ${displayAccent}`}>
                        <span>{displaySign}</span>
                        {displayValue}
                        <DisplayArrow className={`h-5 w-5 ${isNegativeBalance || card.label === 'Expenses' ? 'text-rose-600' : 'text-emerald-600'}`} />
                      </p>
                    </div>
                  </motion.article>
                )
              })}
            </section>

            <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">Modules</p>
                  <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">Modules you added</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
                  <Squares2X2Icon className="h-4 w-4" />
                  {moduleCards.length} modules
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {moduleCards.map((module, index) => (
                  <motion.article
                    key={module.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ delay: index * 0.05, duration: 0.45 }}
                    onClick={() => navigate(`/module/${encodeURIComponent(module.label)}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/module/${encodeURIComponent(module.label)}`)
                      }
                    }}
                    className="cursor-pointer rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl p-3" style={{ backgroundColor: module.theme.iconBg, color: module.theme.fg }}>
                          <module.theme.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-light capitalize text-[var(--text)]">{module.label}</p>
                          <p className="text-sm text-slate-500">{module.submodules.length} submodules</p>
                        </div>
                      </div>
                      <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-[var(--card)] hover:text-[var(--muted)]">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-light uppercase tracking-[0.2em] text-slate-500">Amount</p>
                        <p className={`mt-2 inline-flex items-center gap-1 text-2xl font-light tracking-tight ${module.amountValue < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                          <span>{module.amountValue < 0 ? '-' : module.amountValue > 0 ? '+' : ''}</span>
                          <span>{module.amount}</span>
                        </p>
                      </div>
                      <div className="text-right text-xs font-light text-slate-500">Allocated</div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-[var(--card)]">
                      <div className="h-full rounded-full" style={{ width: `${module.fill}%`, backgroundColor: module.theme.fg }} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {module.submodules.map((submodule) => (
                        <span key={submodule} className="rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-light text-[var(--muted)] shadow-sm ring-1 ring-slate-200">
                          {submodule}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">Recent activity</p>
                    <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">Latest updates</h2>
                  </div>
                  <div className="rounded-full bg-primary-50 p-3 text-primary-600">
                    <CalendarDaysIcon className="h-5 w-5" />
                  </div>
                </div>

                {recentActivity.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {recentActivity.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                        className="flex items-center justify-between rounded-2xl border border-white/6 bg-[var(--card)] px-4 py-4"
                      >
                        <div>
                          <p className="font-light text-[var(--text)]">{item.title}</p>
                          <p className="text-sm text-slate-500">{item.meta}</p>
                        </div>
                        <p className={`text-sm font-light ${item.tone}`}>{item.amount}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-[var(--card)] px-4 py-6 text-sm text-slate-500">
                    No transactions yet. Add your first transaction to see activity here.
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">Workspace</p>
                    <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">Current summary</h2>
                  </div>
                  <div className="rounded-full bg-violet-50 p-3 text-violet-600">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4 rounded-[1.5rem] bg-[var(--card)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Organization</span>
                    <span className="font-light text-[var(--text)]">{activeOrganization.organizationName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Currency</span>
                    <span className="font-light text-[var(--text)]">{activeCurrency?.code || 'USD'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Modules</span>
                    <span className="font-light text-[var(--text)]">{moduleCards.length}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-[var(--card)] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-light uppercase tracking-[0.22em] text-slate-500">Tip</p>
                      <p className="mt-2 text-lg font-light text-[var(--text)]">Add a transaction first to start tracking</p>
                    </div>
                    <PlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={handleDownloadWorkspacePDF} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-light text-white shadow-sm transition hover:bg-rose-700 hover:-translate-y-0.5">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download report
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
            <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">No organization yet</p>
            <h2 className="mt-3 text-2xl font-light text-[var(--text)]">Create your first organization to get started</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Once you create an organization and add modules, your dashboard will automatically show balances, modules, and recent activity here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/create-organization')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
            >
              Create Organization
              <PlusIcon className="h-4 w-4" />
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
