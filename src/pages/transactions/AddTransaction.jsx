// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ModuleSelector from '../../components/transaction/ModuleSelector'
import SubmoduleSelector from '../../components/transaction/SubmoduleSelector'
import TransactionForm from '../../components/transaction/TransactionForm'
import { apiRequest } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../../utils/organizationSync'
import { buildModuleOptions, getModuleSubmodules, getPersistedModuleTransactionType } from '../../utils/moduleUtils'
import {
  evaluateExpression,
  getAmountInputDisplay,
  getPreviewExpression,
  getTodayDate,
  isMongoObjectId,
  readFileAsDataUrl,
  readJSON,
  tokenizeExpression,
} from '../../utils/transactionHelpers'

import translations, {
  translateText,
  getLocale,
  translateModuleLabel,
  translateSubmoduleLabel,
} from '../../i18n/translations'

// Return current HH:MM time
// Function: getCurrentTimeValue
function getCurrentTimeValue() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Transaction add/edit page
export default function AddTransaction() {
  const navigate = useNavigate()
  const { transactionId: encodedTransactionId } = useParams()
  const transactionId = decodeURIComponent(encodedTransactionId || '')
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
  const organizationModules = Array.isArray(activeOrganization?.modules) ? activeOrganization.modules : []
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const isEditMode = Boolean(transactionId)
  const [language, setLanguage] = useState(() => localStorage.getItem('selectedLanguage') || 'en')
  const text = translations[language] || translations.en
  const locale = getLocale(language)
  const location = useLocation()
  const preselectedModuleFromLocation = isEditMode ? '' : String(location?.state?.preselectedModule || '').trim()
  const preselectedModuleData = preselectedModuleFromLocation
    ? organizationModules.find((module) => String(module.name) === preselectedModuleFromLocation) ||
      organizationModules.find((module) => translateModuleLabel(language, module.name) === preselectedModuleFromLocation) ||
      null
    : null
  const initialSelectedModule = preselectedModuleData?.name || preselectedModuleFromLocation || ''
  const initialSelectedSubmodule = preselectedModuleData
    ? getModuleSubmodules(preselectedModuleData, activeOrganization)[0] || ''
    : ''
  const initialTransactionDirection = preselectedModuleData
    ? getPersistedModuleTransactionType(preselectedModuleData)
    : ''
  const [step, setStep] = useState(() => (isEditMode ? 4 : initialSelectedModule ? 3 : 1))
  const [selectedModule, setSelectedModule] = useState(() => initialSelectedModule)
  const [selectedSubmodule, setSelectedSubmodule] = useState(() => initialSelectedSubmodule)
  const [customModuleDraft, setCustomModuleDraft] = useState('')
  const [creatingCustomSubmodule, setCreatingCustomSubmodule] = useState(false)
  const [customSubmoduleDraft, setCustomSubmoduleDraft] = useState('')
  const [transactionDirection, setTransactionDirection] = useState(() => initialTransactionDirection)
  const [amountExpression, setAmountExpression] = useState('')
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [date, setDate] = useState(getTodayDate())
  const [time, setTime] = useState(getCurrentTimeValue())
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isHydrated, setIsHydrated] = useState(!isEditMode)
  const [loadedTransaction, setLoadedTransaction] = useState(null)
  const [forceSubmoduleSelection, setForceSubmoduleSelection] = useState(false)
  const [preselectedFromModule, setPreselectedFromModule] = useState(preselectedModuleFromLocation)
  const [openedFromModule] = useState(() => Boolean(preselectedModuleFromLocation))

  useEffect(() => {
    // Function: handleLanguageChanged
    const handleLanguageChanged = (event) => {
      // Function: newLang
      const newLang = (event && event.detail && event.detail.language) || localStorage.getItem('selectedLanguage') || 'en'
      setLanguage(newLang)
    }

    // Function: handleStorage
    const handleStorage = (event) => {
      if (event.key === 'selectedLanguage') {
        setLanguage(event.newValue || 'en')
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
    const existingTransaction =
      transactions.find((transaction) => String(transaction?.id || transaction?._id || '') === transactionId) || null

    setLoadedTransaction(existingTransaction)

    if (!existingTransaction) {
      setError(text.transactionNotFound)
      setIsHydrated(true)
      return
    }

    setSelectedModule(existingTransaction.module || '')
    setSelectedSubmodule(existingTransaction.submodule || '')
    setTransactionDirection(
      existingTransaction.transactionType ||
      existingTransaction.direction ||
      existingTransaction.transactionDirection ||
      '',
    )
    setAmountExpression(existingTransaction.amountExpression || String(Math.abs(Number(existingTransaction.amount || 0))))
    setNote(existingTransaction.note || '')
    setAttachment(null)
    setDate(existingTransaction.date || getTodayDate())
    setTime(existingTransaction.time || getCurrentTimeValue())
    setError('')
    setSavedMessage('')
    setStep(4)
    setIsHydrated(true)
  }, [isEditMode, transactionId, text.transactionNotFound])

  useEffect(() => {
    const currentModule = organizationModules.find((module) => module.name === selectedModule)
    const currentSubmodules = getModuleSubmodules(currentModule, activeOrganization)
    if (currentModule && !currentSubmodules.includes(selectedSubmodule)) {
      setSelectedSubmodule(currentSubmodules[0] || '')
    }
  }, [organizationModules, selectedModule, selectedSubmodule, activeOrganization])

  const selectedModuleData = organizationModules.find((module) => module.name === selectedModule) || null
  const selectedModuleSubmodules = getModuleSubmodules(selectedModuleData, activeOrganization)
  const moduleOptions = useMemo(() => buildModuleOptions(organizationModules), [organizationModules])
  const tokens = tokenizeExpression(amountExpression)
  const totalAmount = evaluateExpression(amountExpression)
  const previewAmount = evaluateExpression(getPreviewExpression(amountExpression))
  const amountDisplayValue = getAmountInputDisplay(amountExpression)
  const selectedModuleRecord =
    selectedModuleData ||
    organizationModules.find((module) => translateModuleLabel(language, module.name) === selectedModule) ||
    null
  const derivedTransactionType = transactionDirection || getPersistedModuleTransactionType(selectedModuleRecord)
  const canSave = totalAmount !== null && selectedModule && selectedSubmodule && derivedTransactionType
  const selectionModalOpen = step < 4
  const saveButtonLabel = isEditMode ? text.updateTransaction : text.save
  const secondaryButtonLabel = isEditMode ? '' : text.saveAndAddAnother

  // Close selection modal or navigate back
  // Function: closeSelectionModal
  const closeSelectionModal = () => {
    if (isEditMode) {
      setForceSubmoduleSelection(false)
      setStep(4)
      return
    }

    if (step === 3) {
      // If this flow was opened directly from a module card, closing should return
      // to the previous page instead of going back to module selection.
      if (preselectedFromModule) {
        navigate(-1)
        return
      }

      setStep(1)
      setSelectedSubmodule('')
      setCreatingCustomSubmodule(false)
      setCustomSubmoduleDraft('')
      setError('')
      return
    }

    navigate(-1)
  }

  // Function: navigateBackFromTransactionForm
  const navigateBackFromTransactionForm = () => {
    setError('')
    const visitedSubmoduleStep =
      forceSubmoduleSelection ||
      selectedModuleSubmodules.length === 0 ||
      selectedModuleSubmodules.length > 1

    if (visitedSubmoduleStep) {
      setStep(3)
      return
    }

    setStep(1)
    setSelectedModule('')
    setSelectedSubmodule('')
    setTransactionDirection('')
  }

  // Function: handleModuleSelection
  const handleModuleSelection = (moduleName, submodules = [], forceSubmodule = false) => {
    setSelectedModule(moduleName)
    setSelectedSubmodule(submodules[0] || '')
    setError('')

    setStep(3)
  }

  // Function: getSavedTransactionFromResponse
  const getSavedTransactionFromResponse = (responsePayload) => {
    return responsePayload?.data?.transaction || responsePayload?.data || null
  }

  // Function: saveTransaction
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
        setIsSaving(false)
        return
      }
    }

    // const currentUser = readJSON('currentUser', null)
    const transactionPayload = {
      organizationId: activeOrganization?.id || '',
      module: selectedModule,
      submodule: selectedSubmodule,
      transactionType: derivedTransactionType,
      // direction: transactionDirection,
      amountExpression,
      amount: totalAmount,
      note: note.trim(),
      attachmentName: attachment?.name || '',
      attachmentType: attachment?.type || '',
      attachmentDataUrl,
      date,
      time,
      currency: selectedCurrency?.code || 'USD',
    }

    const canSyncTransaction = isEditMode && isMongoObjectId(existingTransactionId)

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

    try {
      if (isEditMode) {
        const nextTransactions = [...transactions]
        const transactionIndex = nextTransactions.findIndex(
          (transaction) => String(transaction?.id || transaction?._id || '') === existingTransactionId,
        )

        if (transactionIndex >= 0) {
          nextTransactions[transactionIndex] = nextTransaction
        } else {
          nextTransactions.unshift(nextTransaction)
        }

        localStorage.setItem('transactions', JSON.stringify(nextTransactions))
        try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) {} }, 80) } catch (e) { /* ignore */ }
      } else {
        localStorage.setItem('transactions', JSON.stringify([nextTransaction, ...transactions]))
        try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) {} }, 80) } catch (e) { /* ignore */ }
      }

      if (attachmentDataUrl) {
        const attachments = readJSON('attachments', [])
        const nextAttachment = {
          transactionId: nextTransaction.id,
          name: nextTransaction.attachmentName,
          type: nextTransaction.attachmentType,
          dataUrl: attachmentDataUrl,
        }

        localStorage.setItem(
          'attachments',
          JSON.stringify([nextAttachment, ...attachments.filter((item) => item.transactionId !== nextTransaction.id)]),
        )
        try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) {} }, 80) } catch (e) { /* ignore */ }
      }

      setSavedMessage(isEditMode ? text.transactionUpdated : text.transactionSaved)
    } catch {
      setIsSaving(false)
      setError(text.unableToSaveTransaction)
      return
    }

    try {
      const orgs = Array.isArray(organizations) ? [...organizations] : []
      const activeId = activeOrgId || orgs[0]?.id
      const updatedOrgs = orgs.map((org) => {
        if (org.id !== activeId) return org
        const modules = Array.isArray(org.modules) ? [...org.modules] : []
        const existing = modules.find((module) => String(module.name) === String(selectedModule))
        if (!existing) {
          const newModule = {
            name: selectedModule,
            submodules: Array.isArray(org.submodules?.[selectedModule]) ? org.submodules[selectedModule] : [],
          }
          if (selectedSubmodule && !newModule.submodules.includes(selectedSubmodule)) {
            newModule.submodules = [...newModule.submodules, selectedSubmodule]
          }
          modules.push(newModule)
        } else if (selectedSubmodule) {
          const submodules = Array.isArray(existing.submodules) ? [...existing.submodules] : []
          if (!submodules.includes(selectedSubmodule)) {
            existing.submodules = [...submodules, selectedSubmodule]
          }
        }

        return { ...org, modules }
      })

      setOrganizations(updatedOrgs)
      localStorage.setItem('organizations', JSON.stringify(updatedOrgs))
    } catch {
      // ignore org local update failures
    }

    let syncError = null

    try {
      if (canSyncTransaction) {
        const response = await apiRequest(`/transactions/${encodeURIComponent(existingTransactionId)}`, {
          method: 'PATCH',
          body: JSON.stringify(transactionPayload),
        })
        const savedTransaction = getSavedTransactionFromResponse(response)
        if (savedTransaction?.id) {
          const current = readJSON('transactions', [])
          const replaced = current.map((transaction) =>
            String(transaction?.id || transaction?._id || '') === existingTransactionId
              ? { ...savedTransaction, ...transactionPayload }
              : transaction,
          )
          try {
            localStorage.setItem('transactions', JSON.stringify(replaced))
            try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) {} }, 80) } catch (e) { /* ignore */ }
          } catch {
            // ignore
          }
        }
      } else if (!isEditMode) {
        const response = await apiRequest('/transactions', {
          method: 'POST',
          body: JSON.stringify(transactionPayload),
        })
        const savedTransaction = getSavedTransactionFromResponse(response)
        if (savedTransaction?.id) {
          const current = readJSON('transactions', [])
          const replaced = current.map((transaction) =>
            transaction.id === nextTransaction.id ? { ...savedTransaction, ...transactionPayload } : transaction,
          )
          try {
            localStorage.setItem('transactions', JSON.stringify(replaced))
            try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) {} }, 80) } catch (e) { /* ignore */ }
          } catch {
            // ignore
          }
        }
      }
    } catch (error) {
      syncError = error
    }

    if (syncError) {
      try {
        localStorage.setItem('transactions', JSON.stringify(transactions))
      } catch {
        // ignore rollback errors
      }

      setIsSaving(false)
      setSavedMessage('')
      setError(syncError?.message || text.unableToSaveTransaction)
      return
    }

    setError('')
    setSavedMessage(
      isEditMode
        ? canSyncTransaction
          ? text.transactionUpdated
          : text.transactionSaved
        : text.transactionSaved,
    )

    setIsSaving(false)

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
      setTime(getCurrentTimeValue())
      return
    }

    if (openedFromModule) {
      navigate(`/module/${encodeURIComponent(selectedModule)}`)
    } else {
      navigate('/dashboard')
    }
  }

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center px-4">
        <div className="inner-card-accent w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.noOrganizationFound}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.createOrganizationFirst}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.needOrganizationBeforeAdding}</p>
          <Link
            to="/create-organization"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25"
          >
            {text.createOrganization}
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (!isHydrated) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center px-4">
        <div className="inner-card-accent w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.loadingTransaction}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.preparingEditor}</h1>
        </div>
      </div>
    )
  }

  if (isEditMode && !loadedTransaction) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center px-4">
        <div className="inner-card-accent w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.transactionNotFound}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.unableToEditTransaction}</h1>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25"
          >
            {text.backToTransactions}
          </button>
        </div>
      </div>
    )
  }

  if (selectionModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-2xl font-light tracking-tight text-slate-800">
                {step === 1 ? text.selectModule : text.selectSubmodule}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {step === 1
                  ? text.chooseModuleHint
                  // : translateText(language, 'chooseSubmoduleHint', { module: selectedModuleData?.name || '' })}
                  : translateText(language, 'chooseSubmoduleHint', {
                    module: translateModuleLabel(language, selectedModule),
                  })
                }
              </p>
            </div>
            <button
              type="button"
              onClick={closeSelectionModal}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              aria-label={translateText(language, 'close')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-5 sm:px-6">
            {step === 1 ? (
              <ModuleSelector
                moduleOptions={moduleOptions}
                activeOrganization={activeOrganization}
                organizations={organizations}
                setOrganizations={setOrganizations}
                customModuleDraft={customModuleDraft}
                setCustomModuleDraft={setCustomModuleDraft}
                language={language}
                text={text}
                onModuleSelect={(module, category, label) => {
                  setTransactionDirection(category)
                  handleModuleSelection(label, getModuleSubmodules(module, activeOrganization))
                }}
              />
            ) : (
              <SubmoduleSelector
                selectedModule={selectedModule}
                selectedModuleName={translateModuleLabel(
                  language,
                  selectedModuleData?.name,
                )}
                submodules={selectedModuleSubmodules}
                selectedSubmodule={translateSubmoduleLabel(
                  language,
                  selectedSubmodule,
                )}
                organizations={organizations}
                setOrganizations={setOrganizations}
                activeOrganization={activeOrganization}
                creatingCustomSubmodule={creatingCustomSubmodule}
                setCreatingCustomSubmodule={setCreatingCustomSubmodule}
                customSubmoduleDraft={customSubmoduleDraft}
                setCustomSubmoduleDraft={setCustomSubmoduleDraft}
                language={language}
                text={text}
                onSubmoduleSelect={(submodule) => {
                  setSelectedSubmodule(submodule)
                  setForceSubmoduleSelection(false)
                  setStep(4)
                }}
                onCustomSubmoduleCreated={(submodule) => {
                  setSelectedSubmodule(submodule)
                  setForceSubmoduleSelection(false)
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-light-violet h-full overflow-hidden px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mt-2 mb-6 flex items-center justify-between gap-3">
          <Link
            to={isEditMode ? '/transactions' : '/dashboard'}
            className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {isEditMode ? text.backToTransactions : text.backToDashboard}
          </Link>
          <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
            {isEditMode ? text.editTransaction : activeOrganization.organizationName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          {step === 4 ? (
            <TransactionForm
              isEditMode={isEditMode}
              text={text}
              language={language}
              locale={locale}
              selectedCurrency={selectedCurrency}
              selectedModuleName={translateModuleLabel(
                language,
                selectedModuleData?.name,
              )}
              selectedSubmodule={translateSubmoduleLabel(
                language,
                selectedSubmodule,
              )}
              amountDisplayValue={amountDisplayValue}
              amountExpression={amountExpression}
              setAmountExpression={(updater) => {
                setAmountExpression(updater)
                setError('')
              }}
              previewAmount={previewAmount}
              tokens={tokens}
              note={note}
              setNote={setNote}
              attachment={attachment}
              setAttachment={setAttachment}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              error={error}
              savedMessage={savedMessage}
              canSave={canSave}
              isSaving={isSaving}
              saveButtonLabel={saveButtonLabel}
              secondaryButtonLabel={secondaryButtonLabel}
              onBack={navigateBackFromTransactionForm}
              onChangeModule={() => {
                setForceSubmoduleSelection(true)
                setStep(1)
                setSelectedModule('')
                setSelectedSubmodule('')
                setTransactionDirection('')
                setError('')
              }}
              onSave={saveTransaction}
              onSaveAndAddAnother={saveTransaction}
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
