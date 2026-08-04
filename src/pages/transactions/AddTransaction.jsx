// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import CategorySelector from '../../components/transaction/CategorySelector'
import SubCategorySelector from '../../components/transaction/SubcategorySelector'
import TransactionForm from '../../components/transaction/TransactionForm'
import { apiRequest } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../../utils/organizationSync'
import { buildCategoryOptions, getCategorySubcategories, getPersistedCategoryTransactionType } from '../../utils/categoryUtils'
import UpgradeModal from '../../components/common/UpgradeModal'
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
  translateCategoryLabel,
  translateSubcategoryLabel,
} from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'

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
  const organizationCategories = Array.isArray(activeOrganization?.categories) ? activeOrganization.categories : []
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const isEditMode = Boolean(transactionId)
  const { language, text } = useLanguage()
  const locale = getLocale(language)
  const location = useLocation()
  const preselectedDirection = isEditMode ? '' : (location?.state?.preselectedDirection || 'in')
  const initialSelectedCategory = preselectedDirection === 'in' ? 'revenue' : 'expenses'
  const initialSelectedsubcategory = 'default'
  const initialTransactionDirection = preselectedDirection || 'in'

  const [step, setStep] = useState(4)
  const [selectedCategory, setSelectedCategory] = useState(() => initialSelectedCategory)
  const [selectedSubcategory, setSelectedSubcategory] = useState(() => initialSelectedsubcategory)
  const [customCategoryDraft, setCustomCategoryDraft] = useState('')
  const [creatingCustomSubcategory, setCreatingCustomSubcategory] = useState(false)
  const [customSubcategoryDraft, setCustomSubcategoryDraft] = useState('')
  const [transactionDirection, setTransactionDirection] = useState(() => initialTransactionDirection)
  const [paymentMode, setPaymentMode] = useState('')
  const [amountExpression, setAmountExpression] = useState('')
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [date, setDate] = useState(getTodayDate())
  const [time, setTime] = useState(getCurrentTimeValue())
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [isHydrated, setIsHydrated] = useState(!isEditMode)
  const [loadedTransaction, setLoadedTransaction] = useState(null)
  const [forceSubcategorySelection, setForceSubcategorySelection] = useState(false)
  const [preselectedFromCategory, setPreselectedFromCategory] = useState('')
  const [openedFromCategory] = useState(false)



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

    setSelectedCategory(existingTransaction.category || '')
    setSelectedSubcategory(existingTransaction.subcategory || '')
    setTransactionDirection(
      existingTransaction.direction ||
      existingTransaction.transactionType ||
      existingTransaction.transactionDirection ||
      '',
    )
    setPaymentMode(existingTransaction.paymentMode || 'online')
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
    const currentCategory = organizationCategories.find((category) => category.name === selectedCategory)
    const currentsubcategories = getCategorySubcategories(currentCategory, activeOrganization)
    if (currentCategory && !currentsubcategories.includes(selectedSubcategory)) {
      setSelectedSubcategory(currentsubcategories[0] || '')
    }
  }, [organizationCategories, selectedCategory, selectedSubcategory, activeOrganization])

  const selectedCategoryData = organizationCategories.find((category) => category.name === selectedCategory) || null
  const selectedCategorySubcategories = getCategorySubcategories(selectedCategoryData, activeOrganization)
  const categoryOptions = useMemo(() => buildCategoryOptions(organizationCategories), [organizationCategories])
  const tokens = tokenizeExpression(amountExpression)
  const totalAmount = evaluateExpression(amountExpression)
  const previewAmount = evaluateExpression(getPreviewExpression(amountExpression))
  const amountDisplayValue = getAmountInputDisplay(amountExpression)
  const selectedCategoryRecord =
    selectedCategoryData ||
    organizationCategories.find((category) => translateCategoryLabel(language, category.name) === selectedCategory) ||
    null
  const derivedTransactionType = transactionDirection || getPersistedCategoryTransactionType(selectedCategoryRecord)
  const canSave = previewAmount !== null && previewAmount !== 0 && selectedCategory && selectedSubcategory && derivedTransactionType && note.trim() !== ''
  const selectionModalOpen = step < 4
  const saveButtonLabel = isEditMode ? text.updateTransaction : text.save
  const secondaryButtonLabel = isEditMode ? '' : text.saveAndAddAnother

  // Close selection modal or navigate back
  // Function: closeSelectionModal
  const closeSelectionModal = () => {
    if (isEditMode) {
      setForceSubcategorySelection(false)
      setStep(4)
      return
    }

    if (step === 3) {
      // If this flow was opened directly from a category card, closing should return
      // to the previous page instead of going back to category selection.
      if (preselectedFromCategory) {
        navigate(-1)
        return
      }

      setStep(1)
      setSelectedSubcategory('')
      setCreatingCustomSubcategory(false)
      setCustomSubcategoryDraft('')
      setError('')
      return
    }

    navigate(-1)
  }

  // Function: navigateBackFromTransactionForm
  const navigateBackFromTransactionForm = () => {
    setError('')
    const visitedsubCategoriestep =
      forceSubcategorySelection ||
      selectedCategorySubcategories.length === 0 ||
      selectedCategorySubcategories.length > 1

    if (visitedsubCategoriestep) {
      setStep(3)
      return
    }

    setStep(1)
    setSelectedCategory('')
    setSelectedSubcategory('')
    setTransactionDirection('')
  }

  // Function: handleCategorySelection
  const handleCategorySelection = (categoryName, subcategories = [], forcesubcategory = false) => {
    setSelectedCategory(categoryName)
    setSelectedSubcategory(subcategories[0] || '')
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
    setIsSaving(stayOnPage ? 'saveAndAdd' : 'save')
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

    const activeBookName = loadedTransaction?.book || localStorage.getItem(`activeBookName_${activeOrgId}`) || 'Default Book'
    const transactionPayload = {
      organizationId: activeOrganization?.id || '',
      category: selectedCategory,
      subcategory: selectedSubcategory,
      direction: transactionDirection,
      amountExpression: totalAmount !== null ? amountExpression : String(previewAmount || 0),
      amount: totalAmount !== null ? totalAmount : (previewAmount !== null ? previewAmount : 0),
      note: note.trim(),
      attachmentName: attachment?.name || '',
      attachmentType: attachment?.type || '',
      attachmentDataUrl,
      date,
      time,
      currency: selectedCurrency?.code || 'USD',
      book: activeBookName,
      paymentMode: paymentMode || 'online',
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
        try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) { } }, 80) } catch (e) { /* ignore */ }
      } else {
        localStorage.setItem('transactions', JSON.stringify([nextTransaction, ...transactions]))
        try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) { } }, 80) } catch (e) { /* ignore */ }
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
        try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) { } }, 80) } catch (e) { /* ignore */ }
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
        const categories = Array.isArray(org.categories) ? [...org.categories] : []
        const existing = categories.find((category) => String(category.name) === String(selectedCategory))
        if (!existing) {
          const newCategory = {
            name: selectedCategory,
            subcategories: Array.isArray(org.subcategories?.[selectedCategory]) ? org.subcategories[selectedCategory] : [],
          }
          if (selectedSubcategory && !newCategory.subcategories.includes(selectedSubcategory)) {
            newCategory.subcategories = [...newCategory.subcategories, selectedSubcategory]
          }
          categories.push(newCategory)
        } else if (selectedSubcategory) {
          const subcategories = Array.isArray(existing.subcategories) ? [...existing.subcategories] : []
          if (!subcategories.includes(selectedSubcategory)) {
            existing.subcategories = [...subcategories, selectedSubcategory]
          }
        }

        return { ...org, categories }
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
            try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) { } }, 80) } catch (e) { /* ignore */ }
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
            try { window.dispatchEvent(new Event('transactions:updated')); setTimeout(() => { try { window.dispatchEvent(new Event('transactions:updated')) } catch (e) { } }, 80) } catch (e) { /* ignore */ }
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

      const isLimitReached = syncError?.message && (
        syncError.message.includes('limit reached') || 
        syncError.message.includes('Limit reached') ||
        syncError.message.includes('500 transactions')
      )

      if (isLimitReached) {
        setUpgradeMessage('Transaction Limit Reached: Free plan is limited to 500 transactions per month. Please upgrade your plan below to log unlimited transactions!')
        setShowUpgradeModal(true)
      } else {
        setError(syncError?.message || text.unableToSaveTransaction)
      }
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

    if (stayOnPage) {
      setAmountExpression('')
      setNote('')
      setAttachment(null)
      setDate(getTodayDate())
      setTime(getCurrentTimeValue())
      setPaymentMode('')
      return
    }

    navigate(`/book-transactions/${encodeURIComponent(activeBookName)}`)
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
                {step === 1 ? text.selectCategory : text.selectsubcategory}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {step === 1
                  ? text.chooseCategoryHint
                  // : translateText(language, 'chooseSubcategoryHint', { category: selectedCategoryData?.name || '' })}
                  : translateText(language, 'chooseSubcategoryHint', {
                    category: translateCategoryLabel(language, selectedCategory),
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
              <CategorySelector
                categoryOptions={categoryOptions}
                activeOrganization={activeOrganization}
                organizations={organizations}
                setOrganizations={setOrganizations}
                customCategoryDraft={customCategoryDraft}
                setCustomCategoryDraft={setCustomCategoryDraft}
                language={language}
                text={text}
                onCategorySelect={(categoryObj, category, label) => {
                  setTransactionDirection(category)
                  handleCategorySelection(label, getCategorySubcategories(categoryObj, activeOrganization))
                }}
              />
            ) : (
              <SubCategorySelector
                selectedCategory={selectedCategory}
                selectedCategoryName={translateCategoryLabel(
                  language,
                  selectedCategoryData?.name,
                )}
                subcategories={selectedCategorySubcategories}
                selectedSubcategory={translateSubcategoryLabel(
                  language,
                  selectedSubcategory,
                )}
                organizations={organizations}
                setOrganizations={setOrganizations}
                activeOrganization={activeOrganization}
                creatingCustomSubcategory={creatingCustomSubcategory}
                setCreatingCustomSubcategory={setCreatingCustomSubcategory}
                customSubcategoryDraft={customSubcategoryDraft}
                setCustomSubcategoryDraft={setCustomSubcategoryDraft}
                language={language}
                text={text}
                onSubcategorySelect={(subcategory) => {
                  setSelectedSubcategory(subcategory)
                  setTransactionDirection(
                    getPersistedCategoryTransactionType(selectedCategoryData)
                  )
                  setForceSubcategorySelection(false)
                  setStep(4)
                }}
                onCustomSubcategoryCreated={(subcategory) => {
                  setSelectedSubcategory(subcategory)
                  setForceSubcategorySelection(false)
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-light-violet h-full overflow-hidden px-4 pt-1 pb-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          {step === 4 ? (
            <TransactionForm
              isEditMode={isEditMode}
              text={text}
              language={language}
              locale={locale}
              selectedCurrency={selectedCurrency}
              selectedCategoryName={selectedCategory}
              selectedSubcategory={selectedSubcategory}
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
              existingAttachmentName={loadedTransaction?.attachmentName || loadedTransaction?.attachment?.name || ''}
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
              onBack={() => navigate(-1)}
              onChangeCategory={null}
              onSave={saveTransaction}
              onSaveAndAddAnother={saveTransaction}
              transactionDirection={transactionDirection}
              setTransactionDirection={(dir) => {
                setTransactionDirection(dir)
                setSelectedCategory(dir === 'in' ? 'revenue' : 'expenses')
              }}
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
            />
          ) : null}
        </motion.div>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
    </div>
  )
}
