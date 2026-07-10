// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
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
import { apiRequest, authenticatedFetch, clearStoredAuth } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../../utils/organizationSync'
import { translateText, getLocale, translateModuleLabel, translateSubmoduleLabel } from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import DashboardHero from '../../components/dashboard/DashboardHero'
import DashboardMetricCards from '../../components/dashboard/DashboardMetricCards'
import DashboardModulesSection from '../../components/dashboard/DashboardModulesSection'
import DashboardRecentActivity from '../../components/dashboard/DashboardRecentActivity'
import DashboardWorkspaceSummary from '../../components/dashboard/DashboardWorkspaceSummary'
import DashboardEmptyState from '../../components/dashboard/DashboardEmptyState'
import { persistOrganizationCurrency } from '../../utils/organizationPersistence'

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

// Function: deriveFirstName
function deriveFirstName(user) {
  const raw = user?.firstName || user?.name || user?.email?.split('@')[0] || 'there'
  return raw.split(/[._-]/)[0].replace(/^[a-z]/, (letter) => letter.toUpperCase())
}

// Function: formatMoney
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

// Function: getTransactionCategory
function getTransactionCategory(transaction) {
  const transactionType = String(transaction?.transactionType || '').toLowerCase()
  const moduleName = String(transaction?.module || transaction?.moduleName || '').toLowerCase()

  if (['lend', 'loan_out', 'loanout'].includes(transactionType) || moduleName === 'lend') {
    return 'lend'
  }

  if (['borrow', 'loan_in', 'loanin'].includes(transactionType) || moduleName === 'borrow') {
    return 'borrow'
  }

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

// Function: normalizeModuleTransactionType
function normalizeModuleTransactionType(value) {
  const normalized = String(value || '').toLowerCase()

  if (['revenue', 'income', 'in', 'credit', 'incoming', 'plus', '+'].includes(normalized)) {
    return 'revenue'
  }

  if (['expense', 'expenses', 'out', 'debit', 'outgoing', 'minus', '-'].includes(normalized)) {
    return 'expenses'
  }

  if (['investment', 'investments'].includes(normalized)) {
    return 'investments'
  }

  return null
}

// Function: getTransactionDirection
function getTransactionDirection(transaction) {
  const category = getTransactionCategory(transaction)
  if (category === 'expenses' || category === 'lend') {
    return 'out'
  }
  return 'in'
}

// Function: getSignedTransactionAmount
function getSignedTransactionAmount(transaction) {
  const amount = Number(transaction?.amount || 0)
  if (!Number.isFinite(amount)) {
    return 0
  }

  const category = getTransactionCategory(transaction)
  if (category === 'expenses' || category === 'lend') {
    return -Math.abs(amount)
  }

  return Math.abs(amount)
}

const moduleThemes = {
  food: { label: 'Food', bg: '#FEF3C7', fg: '#D97706', iconBg: '#FEE8C3', icon: ShoppingBagIcon },
  travel: { label: 'Travel', bg: '#DBEAFE', fg: '#0284C7', iconBg: '#E0F2FE', icon: PaperAirplaneIcon },
  shopping: { label: 'Shopping', bg: '#FCE7F3', fg: '#EC4899', iconBg: '#FBCFE8', icon: ShoppingBagIcon },
  bills: { label: 'Bills', bg: '#FEE2E2', fg: '#DC2626', iconBg: '#FECACA', icon: CreditCardIcon },
  health: { label: 'Health', bg: '#ECE7F5', fg: '#0f4aa6', iconBg: '#EDEFFB', icon: HeartIcon },
  entertainment: { label: 'Entertainment', bg: '#F9A8D4', fg: '#BE185D', iconBg: '#FBE0F0', icon: MusicalNoteIcon },
  education: { label: 'Education', bg: '#E0E7FF', fg: '#4F46E5', iconBg: '#EDE9FE', icon: AcademicCapIcon },
  rent: { label: 'Rent', bg: '#F3E8FF', fg: '#0f4aa6', iconBg: '#EDEFFB', icon: HomeIcon },
  salary: { label: 'Salary', bg: '#DCFCE7', fg: '#16A34A', iconBg: '#DBEAFE', icon: CurrencyDollarIcon },
  investment: { label: 'Investment', bg: '#F5F3FF', fg: '#0f4aa6', iconBg: '#EDEFFB', icon: ChartBarIcon },
  savings: { label: 'Savings', bg: '#ECFDF5', fg: '#059669', iconBg: '#D1FAE5', icon: CircleStackIcon },
  subscriptions: { label: 'Subscriptions', bg: '#FEF08A', fg: '#CA8A04', iconBg: '#FEF3C7', icon: TicketIcon },
  transportation: { label: 'Transportation', bg: '#F3E8FF', fg: '#9333EA', iconBg: '#F3E8FF', icon: TruckIcon },
  insurance: { label: 'Insurance', bg: '#F0FDFB', fg: '#0F766E', iconBg: '#CCFBF1', icon: ShieldCheckIcon },
  custom: { label: 'Custom', bg: '#F8FAFC', fg: '#0F172A', iconBg: '#E2E8F0', icon: Squares2X2Icon },
}

// Function: getModuleSubmodules
function getModuleSubmodules(module, organization) {
  if (Array.isArray(module?.submodules)) {
    return module.submodules
  }

  if (module?.name && Array.isArray(organization?.submodules?.[module.name])) {
    return organization.submodules[module.name]
  }

  return []
}

// Function: buildModuleCards
function buildModuleCards(activeOrganization, currency, transactions, language = 'en', locale = 'en-US') {
  if (!activeOrganization?.modules?.length) {
    return []
  }

  const systemDefaultModuleNames = new Set(['revenue', 'expenses', 'investments', 'investment returns', 'lend', 'borrow'])

  const moduleAmounts = activeOrganization.modules.map((module) => {
    // Function: moduleTransactions
    const moduleTransactions = (transactions || []).filter((transaction) => transaction.module === module.name)
    const normalizedName = module.name.toLowerCase()
    const knownTheme = moduleThemes[normalizedName]
    const theme = knownTheme || moduleThemes.custom
    const transactionType = String(module?.transactionType || module?.moduleType || module?.type || '').toLowerCase()
    const normalizedTransactionType = ['revenue', 'income', 'in', 'credit', 'incoming', 'plus', '+'].includes(transactionType)
      ? 'in'
      : ['expense', 'expenses', 'out', 'debit', 'outgoing', 'minus', '-'].includes(transactionType)
        ? 'out'
        : ['investment', 'investments'].includes(transactionType)
          ? 'investments'
          : null
    const moduleCategory = normalizedTransactionType === 'in' ? 'revenue' : normalizedTransactionType === 'out' ? 'expenses' : (['investment', 'investments'].includes(normalizedName) ? 'investments' : null)
    const amount = moduleTransactions.reduce((sum, transaction) => sum + getSignedTransactionAmount(transaction), 0)
    const recentTransaction = [...moduleTransactions]
      .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))[0] || null

    const recentAmountValue = recentTransaction ? getSignedTransactionAmount(recentTransaction) : 0
    const isDefaultSystemModule = systemDefaultModuleNames.has(normalizedName)
    const isExplicitCustomModule = module?.isCustom === true
    const isLegacyCustomModule = !isDefaultSystemModule

    return {
      label: module.name,
      rawName: module.name,
      submodules: getModuleSubmodules(module, activeOrganization),
      amount,
      theme,
      isCustom: isExplicitCustomModule || isLegacyCustomModule,
      category: moduleCategory,
      transactionType: normalizedTransactionType,
      recentTransaction: recentTransaction
        ? {
            submodule: recentTransaction.submodule || 'No submodule',
            amountValue: recentAmountValue,
            amount: recentAmountValue >= 0 ? formatMoney(recentAmountValue, currency, locale) : `-${formatMoney(Math.abs(recentAmountValue), currency, locale)}`,
          }
        : null,
    }
  })

  const maxAmount = moduleAmounts.reduce((max, item) => Math.max(max, Math.abs(item.amount)), 0)

  return moduleAmounts.map((item, index) => {
    const fill = maxAmount > 0 ? Math.min(92, Math.max(0, Math.round((Math.abs(item.amount) / maxAmount) * 92))) : 0
    const displayAmountValue = item.category === 'investments' ? -Math.abs(item.amount) : item.amount

    return {
      id: `${item.label}-${index}`,
      label: translateModuleLabel(language, item.label),
      rawName: item.label,
      rawSubmodules: [...item.submodules],
      submodules: item.submodules.map((submodule) => translateSubmoduleLabel(language, submodule)),
      amountValue: displayAmountValue,
      amount: formatMoney(Math.abs(displayAmountValue), currency, locale),
      isCustom: item.isCustom,
      category: item.category,
      transactionType: item.transactionType,
      recentTransaction: item.recentTransaction
        ? {
            submodule: translateSubmoduleLabel(language, item.recentTransaction.submodule),
            amountValue: item.recentTransaction.amountValue,
            amount: item.recentTransaction.amount,
          }
        : null,
      theme: item.theme,
      fill,
    }
  })
}

// Function: buildRecentActivity
function buildRecentActivity(transactions, currency, locale = 'en-US', text = {}, language = 'en') {
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

      const displaySubmodule = transaction.submodule ? translateSubmoduleLabel(language, transaction.submodule) : ''
      const displayModule = translateModuleLabel(language, transaction.module)

      const fallbackTitle = displaySubmodule
        ? `${capitalize(displaySubmodule)}`
        : `${capitalize(displayModule || (text.transaction || 'Transaction'))} ${text.update || 'update'}`

      return {
        id: transaction.id || `${transaction.module || 'txn'}-${idx}`,
        transaction,
        editPath: getTransactionEditPath(transaction),
        title: transaction.note?.trim() || fallbackTitle,
        meta: `${capitalize(displayModule || (text.dashboard || 'Dashboard'))} · ${metaDate}`,
        amount: amount >= 0 ? formatMoney(amount, currency, locale) : `-${formatMoney(Math.abs(amount), currency, locale)}`,
        tone: amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
      }
    })
}

// Function: getTransactionEditPath
function getTransactionEditPath(transaction) {
  const transactionId = String(transaction?.id || transaction?._id || '')
  return transactionId ? `/edit-transaction/${encodeURIComponent(transactionId)}` : '/add-transaction'
}

// Function: formatDateLabel
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
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { language, setLanguage, text } = useLanguage()
  const currentUser = readJSON('currentUser', null)
  const selectedCurrency = readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const locale = getLocale(language)
  const [transactionsRevision, setTransactionsRevision] = useState(0)

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
    // Function: handleTransactionsUpdated
    const handleTransactionsUpdated = () => {
      setTransactionsRevision((current) => current + 1)
    }

    window.addEventListener('transactions:updated', handleTransactionsUpdated)
    return () => {
      window.removeEventListener('transactions:updated', handleTransactionsUpdated)
    }
  }, [])

  const activeOrganization = useMemo(() => {
    return organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  }, [organizations, activeOrgId])

  const activeCurrency = activeOrganization?.currency || selectedCurrency
  const transactions = useMemo(() => readJSON('transactions', []), [transactionsRevision])
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
  const moduleTypeByName = useMemo(() => {
    const map = new Map()
    ;(activeOrganization?.modules || []).forEach((module) => {
      const key = String(module?.name || '').toLowerCase()
      if (!key) {
        return
      }

      const normalizedType = normalizeModuleTransactionType(module?.transactionType || module?.moduleType || module?.type)
      if (normalizedType) {
        map.set(key, normalizedType)
      }
    })
    return map
  }, [activeOrganization])

  // Function: getDashboardCategory
  const getDashboardCategory = (transaction) => {
    const moduleName = String(transaction?.module || transaction?.moduleName || '').toLowerCase()
    const moduleBasedType = moduleTypeByName.get(moduleName)

    if (moduleBasedType) {
      return moduleBasedType
    }

    return getTransactionCategory(transaction)
  }

  // Function: getDashboardCardDirection
  const getDashboardCardDirection = (transaction) => {
    const moduleName = String(transaction?.module || transaction?.moduleName || '').toLowerCase()
    const moduleBasedType = moduleTypeByName.get(moduleName)

    if (moduleBasedType === 'revenue') {
      return 'in'
    }

    if (['expenses', 'investments', 'lend'].includes(moduleName)) {
      return 'out'
    }

    if (moduleBasedType === 'expenses' || moduleBasedType === 'investments') {
      return 'out'
    }

    if (moduleName === 'borrow') {
      return 'in'
    }

    return getTransactionDirection(transaction)
  }

  const firstName = deriveFirstName(currentUser)
  const moduleCards = buildModuleCards(activeOrganization, activeCurrency, activeOrganizationTransactions, language, locale)
  const recentActivity = buildRecentActivity(activeOrganizationTransactions, activeCurrency, locale, text, language)

  const inAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getDashboardCardDirection(transaction) === 'in' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const outAmountValue = activeOrganizationTransactions.reduce((sum, transaction) => {
    return getDashboardCardDirection(transaction) === 'out' ? sum + Math.abs(Number(transaction?.amount || 0)) : sum
  }, 0)
  const totalBalanceValue = inAmountValue - outAmountValue

  const totalBalance = formatMoney(totalBalanceValue, activeCurrency, locale)
  const inAmount = formatMoney(inAmountValue, activeCurrency, locale)
  const outAmount = formatMoney(outAmountValue, activeCurrency, locale)

  // Function: handleSwitchOrg
  const handleSwitchOrg = (organizationId) => {
    setActiveOrgId(organizationId)
    setOrgMenuOpen(false)
    setProfileOpen(false)
  }

  // Function: handleCreateNewOrg
  const handleCreateNewOrg = () => {
    setOrgMenuOpen(false)
    navigate('/create-organization', { state: { from: '/dashboard' } })
  }

  // Function: handleChangeCurrency
  const handleChangeCurrency = async (currency) => {
    if (!activeOrganization?.id) {
      return
    }

    await persistOrganizationCurrency(activeOrganization.id, currency, organizations, setOrganizations)
  }

  // Function: handleManageOrg
  const handleManageOrg = () => {
    setOrgMenuOpen(false)
    navigate('/manage-organization')
  }

  // Function: handleLogout
  const handleLogout = () => {
    (async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' })
      } catch (e) {
        // ignore errors from logout request
      }

      try {
        clearStoredAuth()
        localStorage.removeItem('activeOrgId')
      } catch {}

      setProfileOpen(false)
      navigate('/login')
    })()
  }

  // Function: handleDownloadWorkspacePDF
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

  const summaryCards = [
    { kind: 'balance', label: text.balance, value: totalBalance, accent: 'text-[var(--text)]' },
    { kind: 'revenue', label: text.in, value: inAmount, accent: 'text-emerald-600' },
    { kind: 'expenses', label: text.out, value: outAmount, accent: 'text-rose-600' },
  ]

  return (
    <div className="theme-light-violet min-h-screen text-[var(--text)]">
      <DashboardHeader
        activeOrganization={activeOrganization}
        activeOrgId={activeOrgId}
        activeCurrency={activeCurrency}
        currentUser={currentUser}
        firstName={firstName}
        language={language}
        setLanguage={setLanguage}
        text={text}
        organizations={organizations}
        orgMenuOpen={orgMenuOpen}
        profileOpen={profileOpen}
        setOrgMenuOpen={setOrgMenuOpen}
        setProfileOpen={setProfileOpen}
        handleSwitchOrg={handleSwitchOrg}
        handleCreateNewOrg={handleCreateNewOrg}
        handleLogout={handleLogout}
        handleChangeCurrency={handleChangeCurrency}
      />

      <main className="mx-auto max-w-7xl px-10 pb-12 pt-28 sm:px-12 lg:px-16">
        <DashboardHero
          text={text}
          firstName={firstName}
          activeOrganization={activeOrganization}
          language={language}
          onAddTransaction={() => navigate('/add-transaction')}
          onManageOrganization={() => navigate('/manage-organization')}
        />

        {activeOrganization ? (
          <>
            <DashboardMetricCards
              className="-mb-4"
              cards={summaryCards}
              totalBalanceValue={totalBalanceValue}
              revenueAmountValue={inAmountValue}
              expensesAmountValue={outAmountValue}
              activeCurrency={activeCurrency}
              locale={locale}
            />

            <DashboardModulesSection
              text={text}
              moduleCards={moduleCards}
              activeOrganization={activeOrganization}
              organizations={organizations}
              setOrganizations={setOrganizations}
              onModuleClick={(moduleLabel) => navigate(`/module/${encodeURIComponent(moduleLabel)}`)}
            />

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <DashboardRecentActivity text={text} recentActivity={recentActivity} />
              <DashboardWorkspaceSummary
                text={text}
                activeOrganization={activeOrganization}
                activeCurrency={activeCurrency}
                moduleCards={moduleCards}
                onDownloadReport={handleDownloadWorkspacePDF}
              />
            </section>
          </>
        ) : (
          <DashboardEmptyState
            text={text}
            onCreateOrganization={() => navigate('/create-organization', { state: { from: '/dashboard' } })}
          />
        )}
      </main>
    </div>
  )
}
