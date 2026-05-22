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
  GlobeAltIcon,
  PlusIcon,
  Squares2X2Icon,
  UserCircleIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  PaperAirplaneIcon,
  HomeIcon,
  CreditCardIcon,
  HeartIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  TicketIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import { authenticatedFetch } from '../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../utils/organizationSync'
import translations, { translateText, getLocale, translateModuleLabel } from '../i18n/translations'

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

function formatMoney(value, currency, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${value.toLocaleString()}`
  }
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
  const category = getTransactionCategory(transaction)
  return category === 'expenses' ? 'out' : 'in'
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

const moduleThemes = {
  food: { label: 'Food', bg: '#FEF3C7', fg: '#D97706', iconBg: '#FEE8C3', icon: ShoppingBagIcon },
  travel: { label: 'Travel', bg: '#DBEAFE', fg: '#0284C7', iconBg: '#E0F2FE', icon: PaperAirplaneIcon },
  shopping: { label: 'Shopping', bg: '#FCE7F3', fg: '#EC4899', iconBg: '#FBCFE8', icon: ShoppingBagIcon },
  bills: { label: 'Bills', bg: '#FEE2E2', fg: '#DC2626', iconBg: '#FECACA', icon: CreditCardIcon },
  health: { label: 'Health', bg: '#ECE7F5', fg: '#7C3AED', iconBg: '#EDE9FE', icon: HeartIcon },
  entertainment: { label: 'Entertainment', bg: '#F9A8D4', fg: '#BE185D', iconBg: '#FBE0F0', icon: MusicalNoteIcon },
  education: { label: 'Education', bg: '#E0E7FF', fg: '#4F46E5', iconBg: '#EDE9FE', icon: AcademicCapIcon },
  rent: { label: 'Rent', bg: '#F3E8FF', fg: '#7C3AED', iconBg: '#EDE9FE', icon: HomeIcon },
  salary: { label: 'Salary', bg: '#DCFCE7', fg: '#16A34A', iconBg: '#DBEAFE', icon: CurrencyDollarIcon },
  investment: { label: 'Investment', bg: '#F5F3FF', fg: '#7C3AED', iconBg: '#EDE9FE', icon: ChartBarIcon },
  savings: { label: 'Savings', bg: '#ECFDF5', fg: '#059669', iconBg: '#D1FAE5', icon: CircleStackIcon },
  subscriptions: { label: 'Subscriptions', bg: '#FEF08A', fg: '#CA8A04', iconBg: '#FEF3C7', icon: TicketIcon },
  transportation: { label: 'Transportation', bg: '#F3E8FF', fg: '#9333EA', iconBg: '#F3E8FF', icon: TruckIcon },
  insurance: { label: 'Insurance', bg: '#F0FDFB', fg: '#0F766E', iconBg: '#CCFBF1', icon: ShieldCheckIcon },
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

function buildModuleCards(activeOrganization, currency, transactions, language = 'en', locale = 'en-US') {
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
      label: translateModuleLabel(language, item.label),
      submodules: item.submodules.map((submodule) => translateModuleLabel(language, submodule)),
      amountValue: item.amount,
      amount: formatMoney(Math.abs(item.amount), currency, locale),
      theme: item.theme,
      fill,
    }
  })
}

function buildRecentActivity(transactions, currency, locale = 'en-US', text = {}) {
  return [...(transactions || [])]
    .filter((transaction) => Number.isFinite(Number(transaction?.amount)))
    .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))
    .slice(0, 4)
    .map((transaction, idx) => {
      const amount = getSignedTransactionAmount(transaction)
      const activityTime = transaction.createdAt || transaction.date || ''
      const metaDate = activityTime
        ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(activityTime))
        : text.noDate || 'No date'

      return {
        id: transaction.id || `${transaction.module || 'txn'}-${idx}`,
        transaction,
        title: transaction.note?.trim() || `${capitalize(transaction.module || (text.transaction || 'Transaction'))} ${text.update || 'update'}`,
        meta: `${capitalize(transaction.module || (text.dashboard || 'Dashboard'))} · ${metaDate}`,
        amount: amount >= 0 ? formatMoney(amount, currency, locale) : `-${formatMoney(Math.abs(amount), currency, locale)}`,
        tone: amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
      }
    })
}

function getTransactionEditPath(transaction) {
  const transactionId = String(transaction?.id || transaction?._id || '')
  return transactionId ? `/edit-transaction/${encodeURIComponent(transactionId)}` : '/add-transaction'
}

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

// translations are now provided by src/i18n/translations.js

export default function Dashboard() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('activeOrgId') || readCachedOrganizations()[0]?.id || '')
  const [language, setLanguage] = useState(() => localStorage.getItem('selectedLanguage') || 'en')
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const currentUser = readJSON('currentUser', null)
  const selectedCurrency = readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const text = translations[language] || translations.en
  const locale = getLocale(language)

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

  useEffect(() => {
    localStorage.setItem('selectedLanguage', language)
    document.documentElement.lang = language
    try {
      window.dispatchEvent(new CustomEvent('language:changed', { detail: { language } }))
    } catch (e) {
      // ignore
    }
  }, [language])

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
  const moduleCards = buildModuleCards(activeOrganization, activeCurrency, activeOrganizationTransactions, language, locale)
  const recentActivity = buildRecentActivity(activeOrganizationTransactions, activeCurrency, locale, text)

  const revenueAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getTransactionCategory(transaction) === 'revenue' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const expensesAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getTransactionCategory(transaction) === 'expenses' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const investmentsAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getTransactionCategory(transaction) === 'investments' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const totalBalanceValue = revenueAmountValue - expensesAmountValue

  const totalBalance = formatMoney(totalBalanceValue, activeCurrency, locale)
  const revenueAmount = formatMoney(revenueAmountValue, activeCurrency, locale)
  const expensesAmount = formatMoney(expensesAmountValue, activeCurrency, locale)
  const investmentsAmount = formatMoney(Math.abs(investmentsAmountValue), activeCurrency, locale)

  const handleSwitchOrg = (organizationId) => {
    setActiveOrgId(organizationId)
    setOrgMenuOpen(false)
    setProfileOpen(false)
  }

  const handleCreateNewOrg = () => {
    setOrgMenuOpen(false)
    navigate('/create-organization', { state: { from: '/dashboard' } })
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
        alert(text.downloadReportFailed)
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
                    setLanguageMenuOpen((current) => !current)
                    setOrgMenuOpen(false)
                    setProfileOpen(false)
                  }}
                  className="inline-flex items-center gap-3 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label={text.languageLabel}
                >
                  <GlobeAltIcon className="h-4 w-4 text-primary-600" />
                  <span className="max-w-[110px] truncate sm:max-w-[140px]">{language === 'mr' ? text.marathi : text.english}</span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {languageMenuOpen ? (
                  <div className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border border-white/6 bg-[var(--card)] shadow-2xl shadow-slate-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en')
                        setLanguageMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-light transition hover:bg-primary-50 ${language === 'en' ? 'bg-primary-50 text-primary-700' : 'text-[var(--text)]'}`}
                    >
                      {text.english}
                      {language === 'en' ? <span className="text-xs text-primary-700">✓</span> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('mr')
                        setLanguageMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-light transition hover:bg-primary-50 ${language === 'mr' ? 'bg-primary-50 text-primary-700' : 'text-[var(--text)]'}`}
                    >
                      {text.marathi}
                      {language === 'mr' ? <span className="text-xs text-primary-700">✓</span> : null}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOrgMenuOpen((current) => !current)
                    setProfileOpen(false)
                    setLanguageMenuOpen(false)
                  }}
                  className="inline-flex items-center gap-3 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <BuildingOffice2Icon className="h-4 w-4 text-primary-600" />
                  <span className="max-w-[130px] truncate sm:max-w-[180px]">
                    {activeOrganization?.organizationName || text.noOrganizationYet}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {orgMenuOpen ? (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-white/6 bg-[var(--card)] shadow-2xl shadow-slate-200/80">
                    <div className="border-b border-white/4 px-4 py-3">
                      <p className="text-sm font-light text-[var(--text)]">{text.organizationMenuTitle}</p>
                      <p className="text-xs text-slate-500">{text.organizationMenuSubtitle}</p>
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
                              <p className="text-xs text-slate-500">{organization.description || text.noDescription}</p>
                            </div>
                            {activeOrgId === organization.id ? <span className="rounded-full bg-primary-600 px-2 py-1 text-[10px] font-light text-white">{text.active}</span> : null}
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl bg-[var(--card)] px-3 py-4 text-sm text-slate-500">{text.noOrganizationsFound}</div>
                      )}
                    </div>
                    <div className="border-t border-white/4 p-2">
                      <button
                        type="button"
                        onClick={handleCreateNewOrg}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-light text-primary-700 transition hover:bg-primary-50"
                      >
                        {text.createNewOrganization}
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
                    setLanguageMenuOpen(false)
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
                        <p className="text-xs text-slate-500">{currentUser?.email || text.noEmailFound}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 rounded-2xl bg-[var(--card)] p-3 text-sm text-[var(--muted)]">
                      <div className="flex items-center justify-between">
                        <span>{text.organization}</span>
                        <span className="font-light text-[var(--text)]">{activeOrganization?.organizationName || text.noOrganizationYet}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.currency}</span>
                        <span className="font-light text-[var(--text)]">{activeCurrency?.code || 'USD'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.workspaceStatus}</span>
                        <span className="inline-flex items-center gap-1 font-light text-emerald-600">
                          <ShieldCheckIcon className="h-4 w-4" />
                          {text.active}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-white/4 pt-3">
                      <button type="button" onClick={handleLogout} className="w-full rounded-xl px-3 py-3 text-left text-sm font-light text-rose-600 transition hover:bg-rose-50">
                        {text.logout}
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
              <p className="text-sm font-light uppercase tracking-[0.26em] text-primary-600">{text.dashboard}</p>
              <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">
                {translateText(language, 'greeting', { name: firstName })}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
                {translateText(language, 'viewingWorkspace', {
                  org: activeOrganization?.organizationName || 'your workspace',
                  desc: activeOrganization?.description ? ` · ${activeOrganization.description}` : '',
                })}
              </p>
            </div>

            <div className="flex flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                {text.addTransaction}
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/manage-organization')}
                className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-5 py-3 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {text.manageOrganization}
                <BuildingOffice2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {activeOrganization ? (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                { label: text.totalBalance, value: totalBalance, accent: 'text-[var(--text)]' },
                { label: text.revenue, value: revenueAmount, accent: 'text-emerald-600' },
                { label: text.expenses, value: expensesAmount, accent: 'text-rose-600' },
                { label: text.investments, value: investmentsAmount, accent: 'text-violet-600' },
              ].map((card, index) => {
                const isBalanceCard = card.label === text.totalBalance
                const isRevenueCard = card.label === text.revenue
                const isExpensesCard = card.label === text.expenses
                const isInvestmentsCard = card.label === text.investments
                const isNegativeBalance = isBalanceCard && totalBalanceValue < 0
                const isPositiveBalance = isBalanceCard && totalBalanceValue > 0
                const isZeroBalance = isBalanceCard && totalBalanceValue === 0
                const isZeroRevenue = isRevenueCard && revenueAmountValue === 0
                const isZeroExpenses = isExpensesCard && expensesAmountValue === 0
                const isNegativeInvestments = isInvestmentsCard && investmentsAmountValue < 0
                const isPositiveInvestments = isInvestmentsCard && investmentsAmountValue > 0
                const DisplayArrow = card.label === text.expenses || isNegativeBalance || isNegativeInvestments ? ArrowTrendingDownIcon : ArrowTrendingUpIcon
                const displayAccent = isBalanceCard
                  ? isPositiveBalance
                    ? 'text-emerald-600'
                    : isNegativeBalance
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  : isInvestmentsCard
                    ? isPositiveInvestments
                      ? 'text-emerald-600'
                      : isNegativeInvestments
                        ? 'text-rose-600'
                        : 'text-violet-600'
                  : card.accent
                const displaySign = isBalanceCard
                  ? isPositiveBalance
                    ? '+'
                    : isNegativeBalance
                      ? '-'
                      : ''
                  : isInvestmentsCard
                    ? isPositiveInvestments
                      ? '+'
                      : isNegativeInvestments
                        ? '-'
                        : ''
                  : isRevenueCard && !isZeroRevenue
                    ? '+'
                    : isExpensesCard && !isZeroExpenses
                      ? '-'
                      : ''
                const displayValue = isBalanceCard
                  ? formatMoney(Math.abs(totalBalanceValue), activeCurrency, locale)
                  : isInvestmentsCard
                    ? formatMoney(Math.abs(investmentsAmountValue), activeCurrency, locale)
                    : card.value
                const iconColorClass = isZeroBalance || isZeroRevenue || isZeroExpenses
                  ? displayAccent
                  : isNegativeBalance || isNegativeInvestments || isExpensesCard
                    ? 'text-rose-600'
                    : 'text-emerald-600'

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
                        <DisplayArrow className={`h-5 w-5 ${iconColorClass}`} />
                      </p>
                    </div>
                  </motion.article>
                )
              })}
            </section>

            <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.modules}</p>
                  <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.modulesYouAdded}</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
                  <Squares2X2Icon className="h-4 w-4" />
                  {moduleCards.length} {text.modules.toLowerCase()}
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
                          <p className="text-sm text-slate-500">{module.submodules.length} {text.submodules.toLowerCase()}</p>
                        </div>
                      </div>
                      <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-[var(--card)] hover:text-[var(--muted)]">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-light uppercase tracking-[0.2em] text-slate-500">{text.amount}</p>
                        <p className={`mt-2 inline-flex items-center gap-1 text-2xl font-light tracking-tight ${module.amountValue < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                          <span>{module.amountValue < 0 ? '-' : module.amountValue > 0 ? '+' : ''}</span>
                          <span>{module.amount}</span>
                        </p>
                      </div>
                      <div className="text-right text-xs font-light text-slate-500">{text.allocated}</div>
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
                    <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.recentActivity}</p>
                    <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.latestUpdates}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/transactions"
                      className="rounded-full border border-white/6 bg-[var(--card)] px-4 py-2 text-sm font-light text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {text.seeAll}
                    </Link>
                    <div className="rounded-full bg-primary-50 p-3 text-primary-600">
                      <CalendarDaysIcon className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {recentActivity.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {recentActivity.map((item, index) => {
                      const editPath = getTransactionEditPath(item.transaction)

                      return (
                      <Link
                        key={item.id}
                        to={editPath}
                        className="block rounded-2xl border border-white/6 bg-[var(--card)] transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ delay: index * 0.05, duration: 0.4 }}
                          className="flex items-center justify-between rounded-2xl px-4 py-4"
                        >
                          <div>
                            <p className="font-light text-[var(--text)]">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.meta}</p>
                          </div>
                          <p className={`text-sm font-light ${item.tone}`}>{item.amount}</p>
                        </motion.div>
                      </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-[var(--card)] px-4 py-6 text-sm text-slate-500">
                    {text.noTransactionsYet}
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.workspace}</p>
                    <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.currentSummary}</h2>
                  </div>
                  <div className="rounded-full bg-violet-50 p-3 text-violet-600">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4 rounded-[1.5rem] bg-[var(--card)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{text.organization}</span>
                    <span className="font-light text-[var(--text)]">{activeOrganization.organizationName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{text.currency}</span>
                    <span className="font-light text-[var(--text)]">{activeCurrency?.code || 'USD'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{text.modules}</span>
                    <span className="font-light text-[var(--text)]">{moduleCards.length}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-[var(--card)] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-light uppercase tracking-[0.22em] text-slate-500">{text.tip}</p>
                      <p className="mt-2 text-lg font-light text-[var(--text)]">{text.tipMessage}</p>
                    </div>
                    <PlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="button" onClick={handleDownloadWorkspacePDF} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-light text-white shadow-sm transition hover:bg-rose-700 hover:-translate-y-0.5">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    {text.downloadReport}
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
            <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.noOrganizationYet}</p>
            <h2 className="mt-3 text-2xl font-light text-[var(--text)]">{text.createFirstOrganizationTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              {text.createFirstOrganizationDescription}
            </p>
            <button
              type="button"
              onClick={() => navigate('/create-organization', { state: { from: '/dashboard' } })}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
            >
              {text.createOrganization}
              <PlusIcon className="h-4 w-4" />
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
