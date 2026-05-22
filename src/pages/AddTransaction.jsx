import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  PlusIcon,
  Squares2X2Icon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { apiRequest } from '../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../utils/organizationSync'
import translations, { translateText, getLocale } from '../i18n/translations'

const transactionTypeModules = {
  revenue: ['Salary', 'Business', 'Bonus', 'Commission', 'Incentives', 'Rental Income', 'Investment Returns'],
  expenses: ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Rent', 'Subscriptions', 'Loans', 'Taxes'],
  investments: ['Stocks', 'Mutual Funds', 'Fixed Deposit', 'Gold', 'Real Estate', 'PPF'],
}

function getTransactionCategory(transaction) {
  const transactionType = String(transaction?.transactionType || transaction?.direction || transaction?.transactionDirection || '').toLowerCase()

  if (['revenue', 'income', 'in', 'credit', 'incoming', 'plus', '+'].includes(transactionType)) {
    return 'revenue'
  }

  if (['expense', 'expenses', 'out', 'debit', 'outgoing', 'minus', '-'].includes(transactionType)) {
    return 'expenses'
  }

  if (['investment', 'investments'].includes(transactionType)) {
    return 'investments'
  }

  return null
}

function getModuleCategory(module) {
  const transactionType = String(module?.transactionType || module?.type || '').toLowerCase()
  if (transactionType === 'revenue') {
    return 'revenue'
  }
  if (transactionType === 'expenses' || transactionType === 'expense') {
    return 'expenses'
  }
  if (transactionType === 'investments' || transactionType === 'investment') {
    return 'investments'
  }

  const moduleName = String(module?.name || '').toLowerCase()
  for (const [category, names] of Object.entries(transactionTypeModules)) {
    if (names.some((name) => name.toLowerCase() === moduleName)) {
      return category
    }
  }

  return null
}

function getModulesForCategory(category, modules) {
  const normalizedCategory = String(category || '').toLowerCase()
  return (modules || []).filter((module) => {
    const moduleCategory = getModuleCategory(module)
    if (moduleCategory) {
      return moduleCategory === normalizedCategory
    }
    return true
  })
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
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

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''))
}

function sanitizeAmountInput(value) {
  return value.replace(/[^\d+\-*/().\s]/g, '')
}

function tokenizeExpression(expression) {
  return expression.match(/\d+(?:\.\d+)?|[+\-*/()]/g) || []
}

function getLastOperatorIndex(expression) {
  return Math.max(
    expression.lastIndexOf('+'),
    expression.lastIndexOf('-'),
    expression.lastIndexOf('*'),
    expression.lastIndexOf('/'),
  )
}

function isValidExpression(expression) {
  const sanitized = expression.replace(/\s+/g, '')
  if (!sanitized) {
    return false
  }

  if (!/^[\d+\-*/().]+$/.test(sanitized)) {
    return false
  }

  if (!/\d/.test(sanitized)) {
    return false
  }

  if (/[+\-*/.]$/.test(sanitized)) {
    return false
  }
  if (/^[+*/]/.test(sanitized)) {
    return false
  }

  try {
    const result = Function(`"use strict"; return (${sanitized})`)()
    return Number.isFinite(result)
  } catch {
    return false
  }
}

function evaluateExpression(expression) {
  if (!isValidExpression(expression)) {
    return null
  }

  try {
    const sanitized = expression.replace(/\s+/g, '')
    const result = Function(`"use strict"; return (${sanitized})`)()
    return Number.isFinite(result) ? Number(result) : null
  } catch {
    return null
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getPreviewExpression(expression) {
  return expression.replace(/\s+/g, '').replace(/[+\-*/]+$/, '')
}

function getAmountInputDisplay(expression) {
  const sanitized = expression.replace(/\s+/g, '')
  if (!sanitized || /[+\-*/]$/.test(sanitized)) {
    return ''
  }

  const lastOperatorIndex = getLastOperatorIndex(sanitized)
  if (lastOperatorIndex === -1) {
    return sanitized
  }

  return sanitized.slice(lastOperatorIndex + 1)
}

function buildAmountExpression(currentExpression, nextValue) {
  const current = currentExpression.replace(/\s+/g, '')
  const sanitizedNext = sanitizeAmountInput(nextValue)

  if (!sanitizedNext) {
    if (!current) {
      return ''
    }

    if (/[+\-*/]$/.test(current)) {
      return current.slice(0, -1)
    }

    const lastOperatorIndex = getLastOperatorIndex(current)
    return lastOperatorIndex === -1 ? '' : current.slice(0, lastOperatorIndex + 1)
  }

  if (/[+\-*/]$/.test(sanitizedNext)) {
    if (!current) {
      return sanitizedNext
    }

    if (/[+\-*/]$/.test(current)) {
      return current
    }

    return `${current}${sanitizedNext.slice(-1)}`
  }

  if (/[+\-*/]$/.test(current)) {
    return `${current}${sanitizedNext}`
  }

  const lastOperatorIndex = getLastOperatorIndex(current)
  if (lastOperatorIndex === -1) {
    return sanitizedNext
  }

  return `${current.slice(0, lastOperatorIndex + 1)}${sanitizedNext}`
}

function removeTokenFromExpression(expression, removeIndex) {
  const tokens = tokenizeExpression(expression)
  if (tokens.length === 0 || removeIndex < 0 || removeIndex >= tokens.length) {
    return expression
  }

  const nextTokens = [...tokens]
  const token = nextTokens[removeIndex]
  if (!/\d/.test(token)) {
    return expression
  }

  const deleteIndexes = [removeIndex]
  if (removeIndex > 0 && /[+\-*/]/.test(nextTokens[removeIndex - 1])) {
    deleteIndexes.push(removeIndex - 1)
  }
  if (removeIndex < nextTokens.length - 1 && /[+\-*/]/.test(nextTokens[removeIndex + 1])) {
    deleteIndexes.push(removeIndex + 1)
  }

  deleteIndexes
    .sort((left, right) => right - left)
    .forEach((index) => nextTokens.splice(index, 1))

  const normalizedTokens = []
  nextTokens.forEach((currentToken) => {
    const isOperator = /[+\-*/]/.test(currentToken)
    const previousToken = normalizedTokens[normalizedTokens.length - 1]

    if (!previousToken) {
      if (!isOperator) {
        normalizedTokens.push(currentToken)
      }
      return
    }

    if (!isOperator && /\d/.test(previousToken)) {
      normalizedTokens.push('+')
      normalizedTokens.push(currentToken)
      return
    }

    if (isOperator && /[+\-*/]/.test(previousToken)) {
      normalizedTokens[normalizedTokens.length - 1] = currentToken
      return
    }

    if (!isOperator || normalizedTokens.length === 0 || /[+\-*/]/.test(previousToken)) {
      normalizedTokens.push(currentToken)
    }
  })

  while (normalizedTokens.length > 0 && /[+\-*/]/.test(normalizedTokens[0])) {
    normalizedTokens.shift()
  }

  while (normalizedTokens.length > 0 && /[+\-*/]/.test(normalizedTokens[normalizedTokens.length - 1])) {
    normalizedTokens.pop()
  }

  return normalizedTokens.join(' ')
}

export default function AddTransaction() {
  const navigate = useNavigate()
  const { transactionId: encodedTransactionId } = useParams()
  const transactionId = decodeURIComponent(encodedTransactionId || '')
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  
  // Reload organizations from localStorage on component mount to ensure fresh data after updates
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
  const organizationModules = Array.isArray(activeOrganization?.modules) ? activeOrganization.modules : []
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const isEditMode = Boolean(transactionId)
  const [step, setStep] = useState(isEditMode ? 4 : 1)
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedSubmodule, setSelectedSubmodule] = useState('')
  const [creatingCustomModule, setCreatingCustomModule] = useState(false)
  const [customModuleDraft, setCustomModuleDraft] = useState('')
  const [creatingCustomSubmodule, setCreatingCustomSubmodule] = useState(false)
  const [customSubmoduleDraft, setCustomSubmoduleDraft] = useState('')
  const [transactionDirection, setTransactionDirection] = useState('')
  const [amountExpression, setAmountExpression] = useState('')
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [date, setDate] = useState(getTodayDate())
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isHydrated, setIsHydrated] = useState(!isEditMode)
  const [loadedTransaction, setLoadedTransaction] = useState(null)
  const [forceSubmoduleSelection, setForceSubmoduleSelection] = useState(false)

  const [language, setLanguage] = useState(() => localStorage.getItem('selectedLanguage') || 'en')
  const text = translations[language] || translations.en
  const locale = getLocale(language)

  useEffect(() => {
    const handleLanguageChanged = (e) => {
      const newLang = (e && e.detail && e.detail.language) || localStorage.getItem('selectedLanguage') || 'en'
      setLanguage(newLang)
    }

    const handleStorage = (e) => {
      if (e.key === 'selectedLanguage') {
        setLanguage(e.newValue || 'en')
      }
    }

    window.addEventListener('language:changed', handleLanguageChanged)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('language:changed', handleLanguageChanged)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!isEditMode) {
      setIsHydrated(true)
      setLoadedTransaction(null)
      return
    }

    const transactions = readJSON('transactions', [])
    const existingTransaction = transactions.find((transaction) => String(transaction?.id || transaction?._id || '') === transactionId) || null

    setLoadedTransaction(existingTransaction)

    if (!existingTransaction) {
      setError(text.transactionNotFound)
      setIsHydrated(true)
      return
    }

    setSelectedModule(existingTransaction.module || '')
    setSelectedSubmodule(existingTransaction.submodule || '')
    setTransactionDirection(existingTransaction.transactionType || existingTransaction.direction || existingTransaction.transactionDirection || '')
    setAmountExpression(existingTransaction.amountExpression || String(Math.abs(Number(existingTransaction.amount || 0))))
    setNote(existingTransaction.note || '')
    setAttachment(null)
    setDate(existingTransaction.date || getTodayDate())
    setError('')
    setSavedMessage('')
    setStep(4)
    setIsHydrated(true)
  }, [isEditMode, transactionId])

  useEffect(() => {
    const currentModule = organizationModules.find((module) => module.name === selectedModule)
    const currentSubmodules = getModuleSubmodules(currentModule, activeOrganization)
    if (currentModule && !currentSubmodules.includes(selectedSubmodule)) {
      setSelectedSubmodule(currentSubmodules[0] || '')
    }
  }, [organizationModules, selectedModule, selectedSubmodule])

  const selectedModuleData = organizationModules.find((module) => module.name === selectedModule) || null
  const selectedModuleSubmodules = getModuleSubmodules(selectedModuleData, activeOrganization)
  const categoryModules = useMemo(() => getModulesForCategory(transactionDirection, organizationModules), [transactionDirection, organizationModules])
  const tokens = tokenizeExpression(amountExpression)
  const totalAmount = evaluateExpression(amountExpression)
  const previewAmount = evaluateExpression(getPreviewExpression(amountExpression))
  const amountDisplayValue = getAmountInputDisplay(amountExpression)
  const canSave = totalAmount !== null && selectedModule && selectedSubmodule && transactionDirection
  const selectionModalOpen = step < 4
  const saveButtonLabel = isEditMode ? text.updateTransaction : text.save
  const secondaryButtonLabel = isEditMode ? '' : text.saveAndAddAnother

  const closeSelectionModal = () => {
    if (isEditMode) {
      // In edit mode, closing the selection modal should return to the form instead of navigating away
      setForceSubmoduleSelection(false)
      setStep(4)
      return
    }

    navigate(-1)
  }

  const handleModuleSelection = (moduleName, submodules = [], forceSubmodule = false) => {
    setSelectedModule(moduleName)
    setSelectedSubmodule(submodules[0] || '')
    setError('')

    if (forceSubmodule) {
      setStep(3)
      return
    }

    if (!submodules || submodules.length <= 1) {
      setStep(4)
    } else {
      setStep(3)
    }
  }

  const saveTransaction = async (stayOnPage) => {
    if (!canSave) {
      setError(text.enterValidAmountChoose)
      return
    }
    setIsSaving(true)
    setError('')

    const transactions = readJSON('transactions', [])
    const existingTransactionId = String(loadedTransaction?.id || loadedTransaction?._id || transactionId || '')
    const existingAttachmentDataUrl = loadedTransaction?.attachmentDataUrl || ''
    let attachmentDataUrl = existingAttachmentDataUrl

    if (attachment) {
      try {
        attachmentDataUrl = await readFileAsDataUrl(attachment)
      } catch {
        setError(text.unableToSaveTransaction)
        return
      }
    }

    const currentUser = readJSON('currentUser', null)
    const transactionPayload = {
      organizationId: activeOrganization?.id || '',
      module: selectedModule,
      submodule: selectedSubmodule,
      transactionType: transactionDirection,
      direction: transactionDirection,
      amountExpression,
      amount: totalAmount,
      note: note.trim(),
      attachmentName: attachment?.name || '',
      attachmentType: attachment?.type || '',
      attachmentDataUrl,
      date,
      currency: selectedCurrency?.code || 'USD',
      ownerId: currentUser?.id || currentUser?._id || currentUser?.email || '',
    }

    let savedTransaction = null
    let offlineFallback = false
    const canSyncTransaction = isEditMode && isMongoObjectId(existingTransactionId)

    // Build the transaction object we will persist locally immediately (optimistic update)
    const nextTransaction = isEditMode
      ? {
          ...loadedTransaction,
          ...transactionPayload,
          id: loadedTransaction?.id || loadedTransaction?._id || transactionId || Date.now().toString(),
          createdAt: loadedTransaction?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : {
          id: Date.now().toString(),
          ...transactionPayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

    // Persist to localStorage immediately so the UI feels fast (optimistic)
    try {
      if (isEditMode) {
        const nextTransactions = [...transactions]
        const transactionIndex = nextTransactions.findIndex((transaction) => String(transaction?.id || transaction?._id || '') === existingTransactionId)

        if (transactionIndex >= 0) {
          nextTransactions[transactionIndex] = nextTransaction
        } else {
          nextTransactions.unshift(nextTransaction)
        }

        localStorage.setItem('transactions', JSON.stringify(nextTransactions))
      } else {
        localStorage.setItem('transactions', JSON.stringify([nextTransaction, ...transactions]))
      }

      // Attachments stored immediately as well
      if (attachmentDataUrl) {
        const attachments = readJSON('attachments', [])
        const nextAttachment = {
          transactionId: nextTransaction.id,
          name: nextTransaction.attachmentName,
          type: nextTransaction.attachmentType,
          dataUrl: attachmentDataUrl,
        }

        localStorage.setItem('attachments', JSON.stringify([nextAttachment, ...attachments.filter((item) => item.transactionId !== nextTransaction.id)]))
      }

      setSavedMessage(isEditMode ? text.transactionUpdated : text.transactionSaved)
    } catch (err) {
      // localStorage failed, show error
      setIsSaving(false)
      setError(text.unableToSaveTransaction)
      return
    }

    // Update organization modules locally immediately
    try {
      const orgs = Array.isArray(organizations) ? [...organizations] : []
      const activeId = activeOrgId || orgs[0]?.id
      const updatedOrgs = orgs.map((org) => {
        if (org.id !== activeId) return org
        const modules = Array.isArray(org.modules) ? [...org.modules] : []
        const existing = modules.find((m) => String(m.name) === String(selectedModule))
        if (!existing) {
          const newModule = { name: selectedModule, submodules: Array.isArray(org.submodules?.[selectedModule]) ? org.submodules[selectedModule] : [] }
          if (selectedSubmodule && !newModule.submodules.includes(selectedSubmodule)) {
            newModule.submodules = [...newModule.submodules, selectedSubmodule]
          }
          modules.push(newModule)
        } else if (selectedSubmodule) {
          const submods = Array.isArray(existing.submodules) ? [...existing.submodules] : []
          if (!submods.includes(selectedSubmodule)) {
            existing.submodules = [...submods, selectedSubmodule]
          }
        }

        return { ...org, modules }
      })

      setOrganizations(updatedOrgs)
      localStorage.setItem('organizations', JSON.stringify(updatedOrgs))
    } catch (err) {
      // ignore org local update failures
    }

    // Fire background syncs (network) without blocking the UI
    ;(async () => {
      try {
        if (canSyncTransaction) {
          try {
            const response = await apiRequest(`/transactions/${encodeURIComponent(existingTransactionId)}`, {
              method: 'PATCH',
              body: JSON.stringify(transactionPayload),
            })
            savedTransaction = response?.data?.transaction || null
          } catch (e) {
            offlineFallback = true
          }
        } else if (!isEditMode) {
          try {
            const response = await apiRequest('/transactions', {
              method: 'POST',
              body: JSON.stringify(transactionPayload),
            })
            savedTransaction = response?.data?.transaction || null

            // If server returned canonical transaction id, replace local temporary id
            if (savedTransaction && savedTransaction.id) {
              const current = readJSON('transactions', [])
              const replaced = current.map((t) => (t.id === nextTransaction.id ? { ...savedTransaction, ...transactionPayload } : t))
              try { localStorage.setItem('transactions', JSON.stringify(replaced)) } catch {}
            }
          } catch (e) {
            offlineFallback = true
          }
        }
      } catch (err) {
        // unexpected
      }

      // Organization sync in background
      try {
        const activeId = activeOrgId || (Array.isArray(organizations) && organizations[0]?.id)
        if (!offlineFallback && activeId) {
          const active = (readJSON('organizations', []) || []).find((o) => o.id === activeId) || null
          if (active) {
            const modulesForBackend = (active.modules || []).map((m) => ({ name: m.name, submodules: Array.isArray(m.submodules) ? m.submodules : [] }))
            const submodulesMap = {}
            modulesForBackend.forEach((m) => { submodulesMap[m.name] = Array.isArray(m.submodules) ? m.submodules : [] })
            try {
              await apiRequest(`/organizations/${encodeURIComponent(activeId)}`, {
                method: 'PATCH',
                body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }),
              })
              const refreshed = await loadOrganizationsFromBackend()
              if (Array.isArray(refreshed) && refreshed.length > 0) {
                setOrganizations(refreshed)
                try { localStorage.setItem('organizations', JSON.stringify(refreshed)) } catch {}
              }
            } catch {
              // ignore org sync failures
            }
          }
        }
      } catch {
        // ignore
      }

      // If background found we are offline, update saved message
      if (offlineFallback) {
        setSavedMessage(text.transactionSavedOffline)
      }
    })()

    // Ensure the module exists in the active organization's modules list
    try {
      const orgs = Array.isArray(organizations) ? [...organizations] : []
      const activeId = activeOrgId || orgs[0]?.id
      const updatedOrgs = orgs.map((org) => {
        if (org.id !== activeId) return org
        const modules = Array.isArray(org.modules) ? [...org.modules] : []
        const existing = modules.find((m) => String(m.name) === String(selectedModule))
        if (!existing) {
          const newModule = { name: selectedModule, submodules: Array.isArray(org.submodules?.[selectedModule]) ? org.submodules[selectedModule] : [] }
          if (selectedSubmodule && !newModule.submodules.includes(selectedSubmodule)) {
            newModule.submodules = [...newModule.submodules, selectedSubmodule]
          }
          modules.push(newModule)
        } else if (selectedSubmodule) {
          const submods = Array.isArray(existing.submodules) ? [...existing.submodules] : []
          if (!submods.includes(selectedSubmodule)) {
            existing.submodules = [...submods, selectedSubmodule]
          }
        }

        return { ...org, modules }
      })

      setOrganizations(updatedOrgs)
      localStorage.setItem('organizations', JSON.stringify(updatedOrgs))

      // Attempt to persist modules/submodules to backend when online
      if (!offlineFallback && activeId) {
        try {
          const active = updatedOrgs.find((o) => o.id === activeId) || null
          if (active) {
            const modulesForBackend = (active.modules || []).map((m) => ({ name: m.name, submodules: Array.isArray(m.submodules) ? m.submodules : [] }))
            const submodulesMap = {}
            modulesForBackend.forEach((m) => {
              submodulesMap[m.name] = Array.isArray(m.submodules) ? m.submodules : []
            })

            await apiRequest(`/organizations/${encodeURIComponent(activeId)}`, {
              method: 'PATCH',
              body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }),
            })

            // Refresh organizations from backend to get canonical data
            try {
              const refreshed = await loadOrganizationsFromBackend()
              if (Array.isArray(refreshed) && refreshed.length > 0) {
                setOrganizations(refreshed)
              }
            } catch {
              // ignore refresh failure
            }
          }
        } catch (err) {
          // backend update failed — keep local changes
        }
      }
    } catch (err) {
      // ignore
    }

    if (attachmentDataUrl) {
      const attachments = readJSON('attachments', [])
      const nextAttachment = {
        transactionId: nextTransaction.id,
        name: nextTransaction.attachmentName,
        type: nextTransaction.attachmentType,
        dataUrl: attachmentDataUrl,
      }

      localStorage.setItem('attachments', JSON.stringify([nextAttachment, ...attachments.filter((item) => item.transactionId !== nextTransaction.id)]))
    }

    setError('')
    setSavedMessage(
      isEditMode
        ? (canSyncTransaction ? text.transactionUpdated : text.transactionSavedOffline)
        : offlineFallback
          ? text.transactionSavedOffline : text.transactionSaved,
    )

    if (isEditMode) {
      navigate('/transactions')
      return
    }

    if (stayOnPage) {
      setStep(1)
      setSelectedModule('')
      setSelectedSubmodule('')
      setTransactionDirection('')
      setAmountExpression('')
      setNote('')
      setAttachment(null)
      setDate(getTodayDate())
      return
    }

    navigate('/dashboard')
  }

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center bg-[var(--card)] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.noOrganizationFound}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.createOrganizationFirst}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.needOrganizationBeforeAdding}</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25">
            {text.createOrganization}
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (!isHydrated) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center bg-[var(--card)] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.loadingTransaction}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.preparingEditor}</h1>
        </div>
      </div>
    )
  }

  if (isEditMode && !loadedTransaction) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center bg-[var(--card)] px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.transactionNotFound}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.unableToEditTransaction}</h1>
          <button type="button" onClick={() => navigate('/transactions')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25">
            {text.backToTransactions}
          </button>
        </div>
      </div>
    )
  }

  if (selectionModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-2xl font-light tracking-tight text-slate-800">
                {step === 1 ? text.selectTransactionType : step === 2 ? text.selectModule : text.selectSubmodule}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {step === 1
                  ? text.chooseTypeHint
                  : step === 2
                    ? text.chooseModuleHint
                    : translateText(language, 'chooseSubmoduleHint', { module: selectedModuleData?.name || '' })}
              </p>
            </div>
            <button type="button" onClick={closeSelectionModal} className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900" aria-label={translateText(language, 'close')}>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{step === 1 ? text.chooseTypeLabel : step === 2 ? text.allModulesLabel : text.allSubmodulesLabel}</p>

            {step === 1 ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <motion.button
                  type="button"
                  onClick={() => {
                    setTransactionDirection('revenue')
                    setSelectedModule('')
                    setSelectedSubmodule('')
                    setError('')
                    setStep(2)
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  whileHover={{ y: -2 }}
                  className="rounded-[1.25rem] border border-emerald-600 bg-emerald-600 px-5 py-5 text-left text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition-shadow hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-md"
                >
                  <p className="text-lg font-light">{text.revenue}</p>
                  <p className="mt-1 text-sm text-white/80">{text.chooseTypeHint}</p>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setTransactionDirection('expenses')
                    setSelectedModule('')
                    setSelectedSubmodule('')
                    setError('')
                    setStep(2)
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut', delay: 0.04 }}
                  whileHover={{ y: -2 }}
                  className="rounded-[1.25rem] border border-rose-600 bg-rose-600 px-5 py-5 text-left text-white shadow-[0_10px_24px_rgba(244,63,94,0.22)] transition-shadow hover:border-rose-700 hover:bg-rose-700 hover:shadow-md"
                >
                  <p className="text-lg font-light">{text.expenses}</p>
                  <p className="mt-1 text-sm text-white/80">{text.chooseTypeHint}</p>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setTransactionDirection('investments')
                    setSelectedModule('')
                    setSelectedSubmodule('')
                    setError('')
                    setStep(2)
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut', delay: 0.08 }}
                  whileHover={{ y: -2 }}
                  className="rounded-[1.25rem] border border-violet-600 bg-violet-600 px-5 py-5 text-left text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] transition-shadow hover:border-violet-700 hover:bg-violet-700 hover:shadow-md"
                >
                  <p className="text-lg font-light">{text.investments}</p>
                  <p className="mt-1 text-sm text-white/80">{text.chooseTypeHint}</p>
                </motion.button>
              </div>
            ) : step === 2 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {categoryModules.map((module, index) => {
                  const isSelected = selectedModule === module.name
                  const cardStyles = ['border-orange-200 bg-orange-50 text-orange-700', 'border-primary-200 bg-primary-50 text-primary-700', 'border-violet-200 bg-violet-50 text-violet-700', 'border-emerald-200 bg-emerald-50 text-emerald-700']
                  const selectedStyles = ['border-orange-300 bg-orange-100 shadow-[0_0_0_1px_rgba(249,115,22,0.12)]', 'border-primary-300 bg-primary-100 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]', 'border-violet-300 bg-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]', 'border-emerald-300 bg-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]']
                  const tone = cardStyles[index % cardStyles.length]
                  const activeTone = selectedStyles[index % selectedStyles.length]
                  return (
                    <motion.button
                      key={module.name}
                      type="button"
                      onClick={() => {
                        const subs = getModuleSubmodules(module, activeOrganization)
                        handleModuleSelection(module.name, subs, forceSubmoduleSelection)
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.22, ease: 'easeOut', delay: index * 0.04 }}
                      whileHover={{ y: -2 }}
                      className={`flex min-h-[88px] items-center justify-between rounded-[1.25rem] border px-5 py-4 text-left transition-shadow hover:shadow-md ${isSelected ? activeTone : tone}`}
                    >
                      <div>
                        <p className="text-lg font-light capitalize">{module.name}</p>
                        <p className="mt-1 text-sm opacity-80">{getModuleSubmodules(module, activeOrganization).length} {text.submodules}</p>
                      </div>
                      <Squares2X2Icon className="h-7 w-7 opacity-90" />
                    </motion.button>
                  )
                })}
                {categoryModules.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500 md:col-span-2">
                    {text.noModulesAssigned}
                  </div>
                ) : null}
                {/* Custom module creator */}
                <div className="mt-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex min-h-[88px] items-center rounded-[1.25rem] border border-primary-400 bg-white px-5 py-4 text-left text-slate-500 shadow-[0_0_0_1px_rgba(59,130,246,0.10)] hover:border-primary-500 hover:bg-blue-50"
                    onClick={() => setCreatingCustomModule(true)}
                  >
                    <input
                      type="text"
                      value={customModuleDraft}
                      onChange={(e) => setCustomModuleDraft(e.target.value)}
                      autoFocus
                      onClick={(event) => event.stopPropagation()}
                      onFocus={() => setCreatingCustomModule(true)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (customModuleDraft.trim()) {
                            const name = customModuleDraft.trim()
                            const nextOrgs = organizations.map((org) => {
                              if (org.id === activeOrganization.id) {
                                const nextModules = Array.isArray(org.modules) ? [...org.modules] : []
                                if (!nextModules.find((m) => m.name === name)) {
                                  nextModules.push({ name, submodules: [], transactionType: 'custom' })
                                }
                                return { ...org, modules: nextModules }
                              }
                              return org
                            })
                            setOrganizations(nextOrgs)
                            try { localStorage.setItem('organizations', JSON.stringify(nextOrgs)) } catch {}
                            setCreatingCustomModule(false)
                            setCustomModuleDraft('')

                            handleModuleSelection(name, [], forceSubmoduleSelection)

                            try {
                              const activeId = activeOrganization.id
                              const active = nextOrgs.find((o) => o.id === activeId)
                              if (active) {
                                const modulesForBackend = (active.modules || []).map((m) => ({ name: m.name, transactionType: m.transactionType || 'custom', submodules: Array.isArray(m.submodules) ? m.submodules : [] }))
                                const submodulesMap = {}
                                modulesForBackend.forEach((m) => { submodulesMap[m.name] = Array.isArray(m.submodules) ? m.submodules : [] })
                                await apiRequest(`/organizations/${encodeURIComponent(activeId)}`, { method: 'PATCH', body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }) })
                                const refreshed = await loadOrganizationsFromBackend()
                                if (Array.isArray(refreshed) && refreshed.length > 0) setOrganizations(refreshed)
                              }
                            } catch {
                              // ignore
                            }
                          }
                        }
                      }}
                      className="h-full w-full rounded-xl border-transparent bg-transparent px-4 py-3 text-lg font-light text-black outline-none placeholder:text-slate-400 focus:border-transparent focus:outline-none"
                      placeholder={text.newModulePlaceholder}
                    />
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!customModuleDraft.trim()) return
                        const name = customModuleDraft.trim()
                        const nextOrgs = organizations.map((org) => {
                          if (org.id === activeOrganization.id) {
                            const nextModules = Array.isArray(org.modules) ? [...org.modules] : []
                            if (!nextModules.find((m) => m.name === name)) {
                              nextModules.push({ name, submodules: [], transactionType: 'custom' })
                            }
                            return { ...org, modules: nextModules }
                          }
                          return org
                        })
                        setOrganizations(nextOrgs)
                        try { localStorage.setItem('organizations', JSON.stringify(nextOrgs)) } catch {}
                        setCreatingCustomModule(false)
                        setCustomModuleDraft('')
                        handleModuleSelection(name, [], forceSubmoduleSelection)

                        try {
                          const activeId = activeOrganization.id
                          const active = nextOrgs.find((o) => o.id === activeId)
                          if (active) {
                            const modulesForBackend = (active.modules || []).map((m) => ({ name: m.name, transactionType: m.transactionType || 'custom', submodules: Array.isArray(m.submodules) ? m.submodules : [] }))
                            const submodulesMap = {}
                            modulesForBackend.forEach((m) => { submodulesMap[m.name] = Array.isArray(m.submodules) ? m.submodules : [] })
                            await apiRequest(`/organizations/${encodeURIComponent(activeId)}`, { method: 'PATCH', body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }) })
                            const refreshed = await loadOrganizationsFromBackend()
                            if (Array.isArray(refreshed) && refreshed.length > 0) setOrganizations(refreshed)
                          }
                        } catch {
                          // ignore
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-primary-700 ml-3"
                      aria-label={translateText(language, 'addModule')}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-light text-slate-700">{selectedModuleData?.name || text.selectModule}</div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {selectedModuleSubmodules.map((submodule, index) => {
                    const isSelected = selectedSubmodule === submodule
                    const cardStyles = ['border-orange-200 bg-orange-50 text-orange-700', 'border-primary-200 bg-primary-50 text-primary-700', 'border-violet-200 bg-violet-50 text-violet-700', 'border-emerald-200 bg-emerald-50 text-emerald-700']
                    const selectedStyles = ['border-orange-300 bg-orange-100 shadow-[0_0_0_1px_rgba(249,115,22,0.12)]', 'border-primary-300 bg-primary-100 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]', 'border-violet-300 bg-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]', 'border-emerald-300 bg-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]']
                    const tone = cardStyles[index % cardStyles.length]
                    const activeTone = selectedStyles[index % selectedStyles.length]
                    return (
                      <motion.button
                        key={submodule}
                        type="button"
                        onClick={() => {
                          setSelectedSubmodule(submodule)
                          setForceSubmoduleSelection(false)
                          setStep(4)
                        }}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.22, ease: 'easeOut', delay: index * 0.04 }}
                        whileHover={{ y: -2 }}
                        className={`flex min-h-[88px] items-center justify-between rounded-[1.25rem] border px-5 py-4 text-left transition-shadow hover:shadow-md ${isSelected ? activeTone : tone}`}
                      >
                        <div>
                          <p className="text-lg font-light capitalize">{submodule}</p>
                          <p className="mt-1 text-sm opacity-80">{text.clickToContinue}</p>
                        </div>
                        <Squares2X2Icon className="h-7 w-7 opacity-90" />
                      </motion.button>
                    )
                  })}

                  {/* Custom submodule creator */}
                  <div>
                    {creatingCustomSubmodule ? (
                      <div className="flex min-h-[88px] items-center rounded-[1.25rem] border border-primary-400 bg-white px-5 py-4 text-primary-700 shadow-[0_0_0_1px_rgba(59,130,246,0.10)]">
                        <input
                          type="text"
                          value={customSubmoduleDraft}
                          onChange={(e) => setCustomSubmoduleDraft(e.target.value)}
                          autoFocus
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (!customSubmoduleDraft.trim()) return
                              const name = customSubmoduleDraft.trim()
                              // update org modules
                              const nextOrgs = organizations.map((org) => {
                                if (org.id === activeOrganization.id) {
                                  const nextModules = (org.modules || []).map((m) => {
                                    if (m.name === selectedModule) {
                                      const nextSubs = Array.isArray(m.submodules) ? [...m.submodules] : []
                                      if (!nextSubs.includes(name)) nextSubs.push(name)
                                      return { ...m, submodules: nextSubs }
                                    }
                                    return m
                                  })
                                  return { ...org, modules: nextModules }
                                }
                                return org
                              })
                              setOrganizations(nextOrgs)
                              try { localStorage.setItem('organizations', JSON.stringify(nextOrgs)) } catch {}
                              setSelectedSubmodule(name)
                              setCreatingCustomSubmodule(false)
                              setCustomSubmoduleDraft('')
                              setForceSubmoduleSelection(false)
                              setStep(4)

                              // Persist to backend
                              try {
                                const activeId = activeOrganization.id
                                const active = nextOrgs.find((o) => o.id === activeId)
                                if (active) {
                                  const modulesForBackend = (active.modules || []).map((m) => ({ name: m.name, submodules: Array.isArray(m.submodules) ? m.submodules : [] }))
                                  const submodulesMap = {}
                                  modulesForBackend.forEach((m) => { submodulesMap[m.name] = Array.isArray(m.submodules) ? m.submodules : [] })
                                  await apiRequest(`/organizations/${encodeURIComponent(activeId)}`, { method: 'PATCH', body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }) })
                                  const refreshed = await loadOrganizationsFromBackend()
                                  if (Array.isArray(refreshed) && refreshed.length > 0) setOrganizations(refreshed)
                                }
                              } catch {
                                // ignore backend failures
                              }
                            }
                          }}
                          className="h-full w-full rounded-xl border-transparent bg-transparent px-4 py-3 text-lg font-light text-black outline-none placeholder:text-slate-400 focus:border-transparent focus:outline-none"
                          placeholder={text.newSubmodulePlaceholder}
                        />
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!customSubmoduleDraft.trim()) return
                            const name = customSubmoduleDraft.trim()
                            const nextOrgs = organizations.map((org) => {
                              if (org.id === activeOrganization.id) {
                                const nextModules = (org.modules || []).map((m) => {
                                  if (m.name === selectedModule) {
                                    const nextSubs = Array.isArray(m.submodules) ? [...m.submodules] : []
                                    if (!nextSubs.includes(name)) nextSubs.push(name)
                                    return { ...m, submodules: nextSubs }
                                  }
                                  return m
                                })
                                return { ...org, modules: nextModules }
                              }
                              return org
                            })
                            setOrganizations(nextOrgs)
                            try { localStorage.setItem('organizations', JSON.stringify(nextOrgs)) } catch {}
                            setSelectedSubmodule(name)
                            setCreatingCustomSubmodule(false)
                            setCustomSubmoduleDraft('')
                            setForceSubmoduleSelection(false)
                            setStep(4)

                            // Persist to backend
                            try {
                              const activeId = activeOrganization.id
                              const active = nextOrgs.find((o) => o.id === activeId)
                              if (active) {
                                const modulesForBackend = (active.modules || []).map((m) => ({ name: m.name, submodules: Array.isArray(m.submodules) ? m.submodules : [] }))
                                const submodulesMap = {}
                                modulesForBackend.forEach((m) => { submodulesMap[m.name] = Array.isArray(m.submodules) ? m.submodules : [] })
                                await apiRequest(`/organizations/${encodeURIComponent(activeId)}`, { method: 'PATCH', body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }) })
                                const refreshed = await loadOrganizationsFromBackend()
                                if (Array.isArray(refreshed) && refreshed.length > 0) setOrganizations(refreshed)
                              }
                            } catch {
                              // ignore
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-primary-700"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      ) : (
                      <button type="button" onClick={() => setCreatingCustomSubmodule(true)} className="flex min-h-[88px] w-full items-center justify-between rounded-[1.25rem] border border-primary-400 bg-white px-5 py-4 text-left text-slate-500 shadow-[0_0_0_1px_rgba(59,130,246,0.10)] hover:border-primary-500 hover:bg-primary-50">
                        <span className="text-lg font-light">+ {text.createCustomSubmodule}</span>
                        <TagIcon className="h-6 w-6 opacity-70" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-light-violet min-h-screen bg-[var(--card)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to={isEditMode ? '/transactions' : '/dashboard'} className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <ArrowLeftIcon className="h-4 w-4" />
            {isEditMode ? text.backToTransactions : text.backToDashboard}
          </Link>
          <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
            {isEditMode ? text.editTransaction : activeOrganization.organizationName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          {step === 4 ? (
            <section className="mt-6">
              <div className="rounded-[1.75rem] border border-white/6 bg-[var(--card)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.transactionForm}</p>
                    <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{isEditMode ? text.editTransaction : text.transactionForm}{selectedModuleData?.name ? ` · ${selectedModuleData?.name}` : ''}{selectedSubmodule ? ` · ${selectedSubmodule}` : ''}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <button type="button" onClick={() => { setForceSubmoduleSelection(true); setStep(2); setError('') }} className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-100">
                        {text.changeModule}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setStep(2)} className="rounded-full border border-white/6 bg-[var(--card)] px-4 py-2 text-sm font-light text-[var(--muted)]">{text.back}</button>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-light text-slate-700">{text.enterAmount}</label>
                    <div className="relative rounded-xl border border-primary-500 bg-[var(--card)] px-3 py-2.5 shadow-[0_0_0_1px_rgba(59,130,246,0.08)] focus-within:ring-2 focus-within:ring-primary-500/20">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-light text-[var(--text)]">{selectedCurrency?.symbol || '$'}</div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-light text-slate-500">
                        {previewAmount !== null ? formatMoney(previewAmount, selectedCurrency, locale) : ''}
                      </div>
                      <input
                        type="text"
                        value={amountDisplayValue}
                        onChange={(event) => {
                          setAmountExpression((currentExpression) => buildAmountExpression(currentExpression, event.target.value))
                          setError('')
                        }}
                        placeholder="600"
                        className="w-full bg-transparent pl-7 pr-24 text-base font-light text-[var(--text)] outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {tokens.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm font-light">
                      {tokens.map((token, index) =>
                        /\d/.test(token) ? (
                          <span key={`${token}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-primary-700 shadow-sm">
                            {selectedCurrency?.symbol || '$'}{token}
                            <button type="button" onClick={() => setAmountExpression(removeTokenFromExpression(amountExpression, index))} className="rounded-full p-0.5 text-primary-600 transition hover:bg-primary-100" aria-label={translateText(language, 'removeAmountToken', { token })}>
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ) : (
                          <span key={`${token}-${index}`} className="px-1 text-slate-400">{token}</span>
                        ),
                      )}
                    </div>
                  ) : null}

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-light text-slate-700">{text.notesLabel}</label>
                      <input
                        type="text"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={text.notesPlaceholder}
                        className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-3 py-2.5 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-light text-slate-700">{text.attachmentLabel}</label>
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--muted)] transition hover:border-primary-400 hover:bg-primary-50">
                          <span className="inline-flex items-center gap-2">
                            <PaperClipIcon className="h-4 w-4 text-primary-600" />
                            {attachment?.name || text.uploadFile}
                          </span>
                          <input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-light text-slate-700">{text.dateLabel}</label>
                        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-3 py-2.5 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                      </div>
                    </div>
                  </div>

                  {error ? <p className="text-sm font-light text-rose-600">{error}</p> : null}
                  {savedMessage ? <p className="text-sm font-light text-emerald-600">{savedMessage}</p> : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" disabled={!canSave || isSaving} onClick={() => saveTransaction(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-light text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                      {isSaving ? (
                        <>
                          <ClockIcon className="h-4 w-4 animate-spin" />
                          <span>{text.saving || saveButtonLabel}</span>
                        </>
                      ) : (
                        <>
                          {saveButtonLabel}
                          <CheckCircleIcon className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    {!isEditMode ? (
                      <button type="button" disabled={!canSave || isSaving} onClick={() => saveTransaction(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                        {isSaving ? (
                          <>
                            <ClockIcon className="h-4 w-4 animate-spin" />
                            <span>{text.saving || secondaryButtonLabel}</span>
                          </>
                        ) : (
                          <>
                            {secondaryButtonLabel}
                            <PlusIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
