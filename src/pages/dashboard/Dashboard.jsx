// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
  EnvelopeIcon,
  GlobeAltIcon,
  PlusIcon,
  XMarkIcon,
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
import { loadOrganizationsFromBackend, readCachedOrganizations, loadTransactionsFromBackend } from '../../utils/organizationSync'
import { translateText, getLocale, translateCategoryLabel, translateSubcategoryLabel } from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import DashboardHero from '../../components/dashboard/DashboardHero'
import DashboardMetricCards from '../../components/dashboard/DashboardMetricCards'
import DashboardBooksSection from '../../components/dashboard/DashboardBooksSection'
import DashboardRecentActivity from '../../components/dashboard/DashboardRecentActivity'
import DashboardWorkspaceSummary from '../../components/dashboard/DashboardWorkspaceSummary'
import DashboardEmptyState from '../../components/dashboard/DashboardEmptyState'
import CompleteProfileModal from '../../components/dashboard/CompleteProfileModal'
import { persistOrganizationCurrency } from '../../utils/organizationPersistence'
import { getBooksFromOrganization } from '../../utils/bookUtils'
import UpgradeModal from '../../components/common/UpgradeModal'

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
  const categoryName = String(transaction?.category || transaction?.categoryName || '').toLowerCase()

  if (['lend', 'loan_out', 'loanout'].includes(transactionType) || categoryName === 'lend') {
    return 'lend'
  }

  if (['borrow', 'loan_in', 'loanin'].includes(transactionType) || categoryName === 'borrow') {
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

// Function: normalizeCategoryTransactionType
function normalizeCategoryTransactionType(value) {
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

const categoryThemes = {
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

// Function: getCategorySubcategories
function getCategorySubcategories(category, organization) {
  if (Array.isArray(category?.subcategories)) {
    return category.subcategories
  }

  if (category?.name && Array.isArray(organization?.subcategories?.[category.name])) {
    return organization.subcategories[category.name]
  }

  return []
}

// Function: buildCategoryCards
function buildCategoryCards(activeOrganization, currency, transactions, language = 'en', locale = 'en-US') {
  if (!activeOrganization?.categories?.length) {
    return []
  }

  const systemDefaultCategoryNames = new Set(['revenue', 'expenses', 'investments', 'investment returns', 'lend', 'borrow'])

  const categoryAmounts = activeOrganization.categories.map((category) => {
    // Function: categoryTransactions
    const categoryTransactions = (transactions || []).filter((transaction) => transaction.category === category.name)
    const normalizedName = category.name.toLowerCase()
    const knownTheme = categoryThemes[normalizedName]
    const theme = knownTheme || categoryThemes.custom
    const transactionType = String(category?.transactionType || category?.categoryType || category?.type || '').toLowerCase()
    const normalizedTransactionType = ['revenue', 'income', 'in', 'credit', 'incoming', 'plus', '+'].includes(transactionType)
      ? 'in'
      : ['expense', 'expenses', 'out', 'debit', 'outgoing', 'minus', '-'].includes(transactionType)
        ? 'out'
        : ['investment', 'investments'].includes(transactionType)
          ? 'investments'
          : null
    const categoryCategory = normalizedTransactionType === 'in' ? 'revenue' : normalizedTransactionType === 'out' ? 'expenses' : (['investment', 'investments'].includes(normalizedName) ? 'investments' : null)
    const amount = categoryTransactions.reduce((sum, transaction) => sum + getSignedTransactionAmount(transaction), 0)
    const recentTransaction = [...categoryTransactions]
      .sort((left, right) => new Date(right.createdAt || right.date || 0) - new Date(left.createdAt || left.date || 0))[0] || null

    const recentAmountValue = recentTransaction ? getSignedTransactionAmount(recentTransaction) : 0
    const isDefaultSystemCategory = systemDefaultCategoryNames.has(normalizedName)
    const isExplicitCustomCategory = category?.isCustom === true
    const isLegacyCustomCategory = !isDefaultSystemCategory

    return {
      label: category.name,
      rawName: category.name,
      subcategories: getCategorySubcategories(category, activeOrganization),
      amount,
      theme,
      isCustom: isExplicitCustomCategory || isLegacyCustomCategory,
      category: categoryCategory,
      transactionType: normalizedTransactionType,
      recentTransaction: recentTransaction
        ? {
            subcategory: recentTransaction.subcategory || 'No subcategory',
            amountValue: recentAmountValue,
            amount: recentAmountValue >= 0 ? formatMoney(recentAmountValue, currency, locale) : `-${formatMoney(Math.abs(recentAmountValue), currency, locale)}`,
          }
        : null,
    }
  })

  const maxAmount = categoryAmounts.reduce((max, item) => Math.max(max, Math.abs(item.amount)), 0)

  return categoryAmounts.map((item, index) => {
    const fill = maxAmount > 0 ? Math.min(92, Math.max(0, Math.round((Math.abs(item.amount) / maxAmount) * 92))) : 0
    const displayAmountValue = item.category === 'investments' ? -Math.abs(item.amount) : item.amount

    return {
      id: `${item.label}-${index}`,
      label: translateCategoryLabel(language, item.label),
      rawName: item.label,
      rawsubcategories: [...item.subcategories],
      subcategories: item.subcategories.map((subcategory) => translateSubcategoryLabel(language, subcategory)),
      amountValue: displayAmountValue,
      amount: formatMoney(Math.abs(displayAmountValue), currency, locale),
      isCustom: item.isCustom,
      category: item.category,
      transactionType: item.transactionType,
      recentTransaction: item.recentTransaction
        ? {
            subcategory: translateSubcategoryLabel(language, item.recentTransaction.subcategory),
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

      const displaysubcategory = transaction.subcategory ? translateSubcategoryLabel(language, transaction.subcategory) : ''
      const displayCategory = translateCategoryLabel(language, transaction.category)

      const fallbackTitle = displaysubcategory
        ? `${capitalize(displaysubcategory)}`
        : `${capitalize(displayCategory || (text.transaction || 'Transaction'))} ${text.update || 'update'}`

      return {
        id: transaction.id || `${transaction.category || 'txn'}-${idx}`,
        transaction,
        editPath: getTransactionEditPath(transaction),
        title: transaction.note?.trim() || fallbackTitle,
        meta: metaDate,
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
  const [activeOrgId, setActiveOrgId] = useState(() => {
    const user = readJSON('currentUser', null)
    const key = user ? `activeOrgId_${user.email || user.id}` : 'activeOrgId'
    return localStorage.getItem(key) || localStorage.getItem('activeOrgId') || readCachedOrganizations()[0]?.id || ''
  })
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { language, setLanguage, text } = useLanguage()
  const [currentUser, setCurrentUser] = useState(() => readJSON('currentUser', null))
  const selectedCurrency = readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const locale = getLocale(language)
  const [transactionsRevision, setTransactionsRevision] = useState(0)

  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedReportBook, setSelectedReportBook] = useState('all')
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [reportFormat, setReportFormat] = useState('pdf')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [showMockContacts, setShowMockContacts] = useState(false)
  const [invitations, setInvitations] = useState([])

  const loadInvitations = async () => {
    try {
      const response = await apiRequest('/organizations/invitations')
      if (response?.data?.items) {
        setInvitations(response.data.items)
      }
    } catch (err) {
      console.error('Failed to load invitations:', err)
    }
  }

  const handleAcceptInvitation = async (orgId) => {
    try {
      const response = await apiRequest(`/organizations/${orgId}/invitations/accept`, {
        method: 'POST'
      })
      if (response?.success) {
        alert('Invitation accepted successfully!')
        const refreshedOrgs = await loadOrganizationsFromBackend()
        setOrganizations(refreshedOrgs)
        if (refreshedOrgs.length > 0) {
          setActiveOrgId(orgId)
          const user = readJSON('currentUser', null)
          if (user) {
            localStorage.setItem(`activeOrgId_${user.email || user.id}`, orgId)
          }
          localStorage.setItem('activeOrgId', orgId)
        }
        await loadInvitations()
      }
    } catch (err) {
      alert(err.message || 'Failed to accept invitation')
    }
  }

  const handleDeclineInvitation = async (orgId) => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) return
    try {
      const response = await apiRequest(`/organizations/${orgId}/invitations/decline`, {
        method: 'POST'
      })
      if (response?.success) {
        alert('Invitation declined.')
        await loadInvitations()
      }
    } catch (err) {
      alert(err.message || 'Failed to decline invitation')
    }
  }

  useEffect(() => {
    let cancelled = false

    loadOrganizationsFromBackend().then((refreshedOrganizations) => {
      if (cancelled) {
        return
      }

      setOrganizations(refreshedOrganizations)
      const user = readJSON('currentUser', null)
      const key = user ? `activeOrgId_${user.email || user.id}` : 'activeOrgId'
      const fallbackId = refreshedOrganizations.find((org) => org.id === localStorage.getItem(key))?.id ||
                         refreshedOrganizations.find((org) => org.id === localStorage.getItem('activeOrgId'))?.id ||
                         refreshedOrganizations[0]?.id || ''
      setActiveOrgId(localStorage.getItem(key) || localStorage.getItem('activeOrgId') || fallbackId)
    })

    // Sync current user state with database on mount to correct plans/details
    apiRequest('/auth/me')
      .then((res) => {
        if (!cancelled && res?.data?.user) {
          const freshUser = res.data.user
          localStorage.setItem('currentUser', JSON.stringify(freshUser))
          setCurrentUser(freshUser)
        }
      })
      .catch(() => {
        // Fallback silently if offline or token expired
      })

    loadInvitations()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleOpenAddMember = () => {
      setIsAddMemberOpen(true)
      setMemberEmail('')
      setInviteError('')
      setShowMockContacts(false)
    }
    window.addEventListener('dashboard:add-member', handleOpenAddMember)
    return () => {
      window.removeEventListener('dashboard:add-member', handleOpenAddMember)
    }
  }, [])

  useEffect(() => {
    if (isAddMemberOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isAddMemberOpen])

  const activeOrganization = useMemo(() => {
    return organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  }, [organizations, activeOrgId])

  const activeOrgMembersCount = Array.isArray(activeOrganization?.members) ? activeOrganization.members.length : 0

  const handleContactsPick = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'email']
        const contacts = await navigator.contacts.select(props, { multiple: false })
        if (contacts && contacts.length > 0) {
          const contact = contacts[0]
          const email = contact.email && contact.email[0] ? contact.email[0] : ''
          if (email) {
            setMemberEmail(email)
            setShowMockContacts(false)
            return
          }
        }
      } catch (err) {
        console.log('Native contact picker skipped/failed:', err)
      }
    }
    setShowMockContacts(prev => !prev)
  }

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) {
      setInviteError('Email address is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail.trim())) {
      setInviteError('Please enter a valid email address')
      return
    }

    if ((currentUser.plan_id === 'free' || !currentUser.plan_id) && activeOrgMembersCount >= 3) {
      setIsAddMemberOpen(false)
      setUpgradeMessage('Member Limit Reached: Free plan is limited to 3 members to track expenses in groups. Please upgrade your plan below to invite more members!')
      setShowUpgradeModal(true)
      return
    }

    setIsInviting(true)
    setInviteError('')

    try {
      const response = await apiRequest(`/organizations/${activeOrganization.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail.toLowerCase().trim() })
      })

      if (response?.data) {
        const updatedOrg = response.data
        const updatedOrgs = organizations.map(o => o.id === updatedOrg.id ? updatedOrg : o)
        setOrganizations(updatedOrgs)
        localStorage.setItem('organizations', JSON.stringify(updatedOrgs))
        localStorage.setItem('organization', JSON.stringify(updatedOrg))
        setIsAddMemberOpen(false)
        setMemberEmail('')
        alert('Member invited successfully!')
      }
    } catch (err) {
      if (err?.message && (err.message.includes('limit reached') || err.message.includes('Limit reached') || err.message.includes('3 members'))) {
        setIsAddMemberOpen(false)
        setUpgradeMessage('Member Limit Reached: Free plan is limited to 3 members to track expenses in groups. Please upgrade your plan below to invite more members!')
        setShowUpgradeModal(true)
      } else {
        setInviteError(err.message || 'Failed to invite member')
      }
    } finally {
      setIsInviting(false)
    }
  }

  useEffect(() => {
    localStorage.setItem('organizations', JSON.stringify(organizations))
  }, [organizations])

  useEffect(() => {
    if (activeOrgId) {
      localStorage.setItem('activeOrgId', activeOrgId)
      const user = readJSON('currentUser', null)
      if (user) {
        localStorage.setItem(`activeOrgId_${user.email || user.id}`, activeOrgId)
      }
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
  const categoryTypeByName = useMemo(() => {
    const map = new Map()
    ;(activeOrganization?.categories || []).forEach((category) => {
      const key = String(category?.name || '').toLowerCase()
      if (!key) {
        return
      }

      const normalizedType = normalizeCategoryTransactionType(category?.transactionType || category?.categoryType || category?.type)
      if (normalizedType) {
        map.set(key, normalizedType)
      }
    })
    return map
  }, [activeOrganization])

  // Function: getDashboardCategory
  const getDashboardCategory = (transaction) => {
    const categoryName = String(transaction?.category || transaction?.categoryName || '').toLowerCase()
    const categoryBasedType = categoryTypeByName.get(categoryName)

    if (categoryBasedType) {
      return categoryBasedType
    }

    return getTransactionCategory(transaction)
  }

  // Function: getDashboardCardDirection
  const getDashboardCardDirection = (transaction) => {
    const categoryName = String(transaction?.category || transaction?.categoryName || '').toLowerCase()
    const categoryBasedType = categoryTypeByName.get(categoryName)

    if (categoryBasedType === 'revenue') {
      return 'in'
    }

    if (['expenses', 'investments', 'lend'].includes(categoryName)) {
      return 'out'
    }

    if (categoryBasedType === 'expenses' || categoryBasedType === 'investments') {
      return 'out'
    }

    if (categoryName === 'borrow') {
      return 'in'
    }

    return getTransactionDirection(transaction)
  }

  const firstName = deriveFirstName(currentUser)
  const isProfileIncomplete = !currentUser?.name || !currentUser?.address || !currentUser?.mobile || !currentUser?.profile_pic;
  const categoryCards = buildCategoryCards(activeOrganization, activeCurrency, activeOrganizationTransactions, language, locale)
  const recentActivity = buildRecentActivity(activeOrganizationTransactions, activeCurrency, locale, text, language)

  const booksList = useMemo(() => {
    return getBooksFromOrganization(activeOrganization)
  }, [activeOrganization, organizations])

  const bookBalances = useMemo(() => {
    const balances = {}
    booksList.forEach((b) => {
      balances[b.name] = 0
    })
    activeOrganizationTransactions.forEach((t) => {
      const bookName = t.book || 'Default Book'
      const direction = getDashboardCardDirection(t)
      const amount = Number(t.amount || 0)
      if (direction === 'in') {
        balances[bookName] = (balances[bookName] || 0) + amount
      } else {
        balances[bookName] = (balances[bookName] || 0) - amount
      }
    })
    return balances
  }, [booksList, activeOrganizationTransactions, getDashboardCardDirection])

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

  const handleDownloadReportSubmit = async (e) => {
    e.preventDefault()
    setDownloadingReport(true)
    try {
      let response
      let filename = ''
      
      const bookQuery = selectedReportBook && selectedReportBook !== 'all' ? `&book=${encodeURIComponent(selectedReportBook)}` : ''
      const bookSuffix = selectedReportBook && selectedReportBook !== 'all' ? `-${selectedReportBook.toLowerCase().replace(/\s+/g, '_')}` : ''

      response = await authenticatedFetch(`/dashboard/report?organizationId=${encodeURIComponent(activeOrganization.id)}${bookQuery}`, {
        method: 'GET',
      })
      filename = `workspace-report-${activeOrganization?.organizationName || 'report'}${bookSuffix}.pdf`

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
      anchor.download = reportData.filename || filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)
      
      setShowDownloadModal(false)
    } catch (err) {
      console.error(err)
      if (err?.message !== 'Your session has expired. Please login again.') {
        alert(text.downloadReportFailed)
      }
    } finally {
      setDownloadingReport(false)
    }
  }

  const yearlyTrendData = useMemo(() => {
    const months = [
      { key: '01', label: 'Jan' },
      { key: '02', label: 'Feb' },
      { key: '03', label: 'Mar' },
      { key: '04', label: 'Apr' },
      { key: '05', label: 'May' },
      { key: '06', label: 'Jun' },
      { key: '07', label: 'Jul' },
      { key: '08', label: 'Aug' },
      { key: '09', label: 'Sep' },
      { key: '10', label: 'Oct' },
      { key: '11', label: 'Nov' },
      { key: '12', label: 'Dec' },
    ]

    const currentYear = new Date().getFullYear()
    const monthlySummary = months.map((m) => {
      let income = 0
      let expense = 0
      
      activeOrganizationTransactions.forEach((t) => {
        const tDate = new Date(t.createdAt || t.date)
        if (tDate.getFullYear() === currentYear) {
          const monthStr = String(tDate.getMonth() + 1).padStart(2, '0')
          if (monthStr === m.key) {
            const amount = Math.abs(Number(t.amount || 0))
            const dir = getDashboardCardDirection(t)
            if (dir === 'in') {
              income += amount
            } else if (dir === 'out') {
              expense += amount
            }
          }
        }
      })

      return {
        ...m,
        income,
        expense
      }
    })

    return monthlySummary
  }, [activeOrganizationTransactions, getDashboardCardDirection])

  const savingsRate = (() => {
    if (!inAmountValue || inAmountValue <= 0) return 0
    const rate = ((inAmountValue - outAmountValue) / inAmountValue) * 100
    return Math.max(-999, Math.min(100, Math.round(rate)))
  })()

  const summaryCards = [
    { kind: 'balance', label: text.balance, value: totalBalance, accent: 'text-[var(--text)]' },
    { kind: 'revenue', label: text.in, value: inAmount, accent: 'text-emerald-600' },
    { kind: 'expenses', label: text.out, value: outAmount, accent: 'text-rose-600' },
    { kind: 'savings', label: 'Savings Rate', value: `${savingsRate >= 0 ? '+' : ''}${savingsRate}%`, accent: savingsRate >= 0 ? 'text-emerald-600' : 'text-rose-600' },
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
        onUpdateProfilePic={(newPic) => {
          const updatedUser = { ...currentUser, profile_pic: newPic }
          localStorage.setItem('currentUser', JSON.stringify(updatedUser))
          setCurrentUser(updatedUser)
        }}
        onUpdateUser={(updated) => {
          localStorage.setItem('currentUser', JSON.stringify(updated))
          setCurrentUser(updated)
        }}
        onUpdateOrganizations={(updatedOrgs) => {
          setOrganizations(updatedOrgs)
          localStorage.setItem('organizations', JSON.stringify(updatedOrgs))
          const active = updatedOrgs.find(o => o.id === activeOrgId) || updatedOrgs[0] || null
          if (active) {
            localStorage.setItem('organization', JSON.stringify(active))
          }
        }}
        setShowUpgradeModal={setShowUpgradeModal}
      />

      {isProfileIncomplete && !(
        localStorage.getItem('profilePromptSkippedAt') &&
        (Date.now() - Number(localStorage.getItem('profilePromptSkippedAt')) < 24 * 60 * 60 * 1000)
      ) && (
        <CompleteProfileModal
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            localStorage.setItem('currentUser', JSON.stringify(updated))
            setCurrentUser(updated)
          }}
          onSkip={() => {
            localStorage.setItem('profilePromptSkippedAt', Date.now().toString())
            setTransactionsRevision(r => r + 1)
          }}
        />
      )}

      <main className="mx-auto max-w-7xl px-10 pb-12 pt-28 sm:px-12 lg:px-16">
        <DashboardHero
          text={text}
          firstName={firstName}
          activeOrganization={activeOrganization}
          language={language}
          onAddTransaction={() => navigate('/add-transaction')}
          onManageOrganization={() => navigate('/manage-organization')}
        />

        {invitations.length > 0 && (
          <div className="mt-6 mb-6 space-y-4">
            {invitations.map(invite => (
              <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-200/50 dark:border-violet-500/20 p-5 text-slate-800 dark:text-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
                    <EnvelopeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Workspace Invitation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      You have been invited to join the workspace <strong className="text-slate-700 dark:text-slate-200">{invite.organizationName}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleAcceptInvitation(invite.id)}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-semibold shadow-sm transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invite.id)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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

            <DashboardBooksSection
              text={text}
              activeOrganization={activeOrganization}
              organizations={organizations}
              setOrganizations={setOrganizations}
              bookBalances={bookBalances}
              selectedCurrency={activeCurrency}
              locale={locale}
            />

            {/* Custom CSS vertical double-bar chart showing monthly Income vs Expense comparison */}
            <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-light tracking-tight text-[var(--text)]">
                    Yearly Trend ({new Date().getFullYear()})
                  </h3>
                  <p className="text-xs font-light text-slate-500 mt-0.5">
                    Side-by-side comparison of monthly income and expenses
                  </p>
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 items-center text-xs font-light text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span>Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-rose-500" />
                    <span>Expenses</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-end justify-between gap-2 overflow-x-auto pb-4 pt-8 h-56 select-none">
                {yearlyTrendData.map((data) => {
                  const maxVal = Math.max(...yearlyTrendData.map(d => Math.max(d.income, d.expense)), 1)
                  const incomeHeight = `${(data.income / maxVal) * 100}%`
                  const expenseHeight = `${(data.expense / maxVal) * 100}%`

                  return (
                    <div key={data.key} className="flex-1 flex flex-col items-center min-w-[50px] group relative">
                      {/* Bars Container */}
                      <div className="h-36 w-full flex items-end justify-center gap-1 relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-950/95 backdrop-blur-sm text-white text-[9px] rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-xl z-20 flex flex-col gap-0.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-300">{data.label} {new Date().getFullYear()}</span>
                          <span className="text-emerald-400">Income: {formatMoney(data.income, activeCurrency, locale)}</span>
                          <span className="text-rose-400">Expense: {formatMoney(data.expense, activeCurrency, locale)}</span>
                        </div>

                        {/* Income Bar */}
                        <div 
                          style={{ height: incomeHeight }} 
                          className="w-2.5 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:bg-emerald-400"
                        />
                        {/* Expense Bar */}
                        <div 
                          style={{ height: expenseHeight }} 
                          className="w-2.5 bg-rose-500 rounded-t-sm transition-all duration-300 hover:bg-rose-400"
                        />
                      </div>
                      
                      {/* Month Label */}
                      <span className="text-[10px] text-slate-500 mt-3 font-light">{data.label}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <DashboardRecentActivity text={text} recentActivity={recentActivity} />
              <DashboardWorkspaceSummary
                text={text}
                activeOrganization={activeOrganization}
                activeCurrency={activeCurrency}
                categoryCards={categoryCards}
                onDownloadReport={() => {
                  setSelectedReportBook('all')
                  setReportFormat('pdf')
                  setShowDownloadModal(true)
                }}
              />
            </section>
          </>
        ) : (
          <DashboardEmptyState
            text={text}
            firstName={firstName}
            onAddOrganization={() => setOrgMenuOpen(true)}
          />
        )}
      </main>

      {/* Download Report Modal */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[var(--card)] rounded-3xl shadow-glass p-6 sm:p-8 border border-white/10"
            >
              <div className="text-center mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
                  <ArrowDownTrayIcon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-light text-[var(--text)]">Download Report</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Select which report you want to download for {activeOrganization?.organizationName}.
                </p>
              </div>

                <form onSubmit={handleDownloadReportSubmit} className="space-y-4">
                {activeOrganization?.books && activeOrganization.books.length > 0 && (
                  <div>
                    <label htmlFor="report-book" className="block text-sm font-light text-slate-700 mb-2">
                      Report Scope
                    </label>
                    <select
                      id="report-book"
                      value={selectedReportBook}
                      onChange={(e) => setSelectedReportBook(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/6 bg-[var(--card)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    >
                      <option value="all">Entire Organization (All Books)</option>
                      {activeOrganization.books.map((book) => {
                        const bookName = typeof book === 'string' ? book : (book?.name || '');
                        return (
                          <option key={bookName} value={bookName}>
                            {bookName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="report-format" className="block text-sm font-light text-slate-700 mb-2">
                    File Format
                  </label>
                  <select
                    id="report-format"
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/6 bg-[var(--card)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="excel">Excel Spreadsheet (.xlsx) 🔒 Pro</option>
                    <option value="csv">CSV (Comma-Separated Values) (.csv) 🔒 Pro</option>
                  </select>
                </div>

                {currentUser?.plan_id === 'free' && (reportFormat === 'excel' || reportFormat === 'csv') && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800 space-y-1.5 text-left">
                    <p className="font-semibold">🔒 Premium Feature</p>
                    <p>Exporting in CSV and Excel formats is only available on the Pro and Enterprise plans.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDownloadModal(false)
                        setUpgradeMessage('Premium Report Export: Exporting reports in Excel (.xlsx) and CSV (.csv) formats is exclusive to Pro and Enterprise workspaces. Upgrade your plan below to unlock all formats!')
                        setShowUpgradeModal(true)
                      }}
                      className="text-violet-700 font-bold hover:underline"
                    >
                      Upgrade Plan Now &rarr;
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDownloadModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-[var(--text)] font-light hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={downloadingReport || (currentUser?.plan_id === 'free' && reportFormat !== 'pdf')}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 font-light text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingReport ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setIsAddMemberOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-850">Add Member</h3>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddMemberSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Member Email</label>
                  <input
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="e.g. colleague@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition"
                  />
                </div>

                {inviteError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-xl">{inviteError}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="flex-1 rounded-2xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition"
                  >
                    {isInviting ? 'Inviting...' : 'Add Member'}
                  </button>
                </div>
              </form>
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
