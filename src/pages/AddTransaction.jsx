import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function loadOrganizations() {
  const organizations = readJSON('organizations', [])
  if (organizations.length > 0) {
    return organizations
  }

  const organization = readJSON('organization', null)
  return organization ? [{ ...organization, id: organization.id || Date.now().toString() }] : []
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

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
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
  const organizations = useMemo(() => loadOrganizations(), [])
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  const selectedCurrency = activeOrganization?.currency || readJSON('selectedCurrency', { code: 'USD', symbol: '$' })
  const [step, setStep] = useState(1)
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedSubmodule, setSelectedSubmodule] = useState('')
  const [amountExpression, setAmountExpression] = useState('')
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [date, setDate] = useState(getTodayDate())
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (activeOrganization?.modules?.length && !selectedModule) {
      setSelectedModule(activeOrganization.modules[0].name)
      setSelectedSubmodule(activeOrganization.modules[0].submodules?.[0] || '')
    }
  }, [activeOrganization, selectedModule])

  useEffect(() => {
    const currentModule = activeOrganization?.modules?.find((module) => module.name === selectedModule)
    if (currentModule && !currentModule.submodules.includes(selectedSubmodule)) {
      setSelectedSubmodule(currentModule.submodules[0] || '')
    }
  }, [activeOrganization, selectedModule, selectedSubmodule])

  const selectedModuleData = activeOrganization?.modules?.find((module) => module.name === selectedModule) || null
  const selectedModuleSubmodules = selectedModuleData?.submodules || []
  const tokens = tokenizeExpression(amountExpression)
  const totalAmount = evaluateExpression(amountExpression)
  const previewAmount = evaluateExpression(getPreviewExpression(amountExpression))
  const amountDisplayValue = getAmountInputDisplay(amountExpression)
  const canSave = totalAmount !== null && selectedModule && selectedSubmodule
  const selectionModalOpen = step < 3

  const closeSelectionModal = () => {
    navigate('/dashboard')
  }

  const saveTransaction = async (stayOnPage) => {
    if (!canSave) {
      setError('Enter a valid amount and choose a module and submodule')
      return
    }

    const transactions = readJSON('transactions', [])
    let attachmentDataUrl = ''

    if (attachment) {
      try {
        attachmentDataUrl = await readFileAsDataUrl(attachment)
      } catch {
        setError('Unable to read the attachment file')
        return
      }
    }

    const nextTransaction = {
      id: Date.now().toString(),
      organizationId: activeOrganization?.id || '',
      module: selectedModule,
      submodule: selectedSubmodule,
      amountExpression,
      amount: totalAmount,
      note: note.trim(),
      attachmentName: attachment?.name || '',
      attachmentType: attachment?.type || '',
      attachmentDataUrl,
      date,
      currency: selectedCurrency?.code || 'USD',
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem('transactions', JSON.stringify([nextTransaction, ...transactions]))

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
    setSavedMessage('Transaction saved successfully')

    if (stayOnPage) {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">No organization found</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-slate-900">Create an organization first</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">You need at least one organization before adding transactions.</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-blue-500/25">
            Create Organization
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (selectionModalOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-2xl font-light tracking-tight text-slate-900">{step === 1 ? 'Select Module' : 'Select Submodule'}</h2>
              <p className="mt-1 text-sm text-slate-500">{step === 1 ? 'Choose a module to continue.' : `Choose a submodule for ${selectedModuleData?.name}.`}</p>
            </div>
            <button type="button" onClick={closeSelectionModal} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700" aria-label="Close">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{step === 1 ? 'All Modules' : 'All Submodules'}</p>

            {step === 1 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activeOrganization.modules.map((module, index) => {
                  const isSelected = selectedModule === module.name
                  const cardStyles = ['border-orange-200 bg-orange-50 text-orange-700', 'border-blue-200 bg-blue-50 text-blue-700', 'border-violet-200 bg-violet-50 text-violet-700', 'border-emerald-200 bg-emerald-50 text-emerald-700']
                  const selectedStyles = ['border-orange-300 bg-orange-100 shadow-[0_0_0_1px_rgba(249,115,22,0.12)]', 'border-blue-300 bg-blue-100 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]', 'border-violet-300 bg-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]', 'border-emerald-300 bg-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]']
                  const tone = cardStyles[index % cardStyles.length]
                  const activeTone = selectedStyles[index % selectedStyles.length]
                  return (
                    <motion.button
                      key={module.name}
                      type="button"
                      onClick={() => {
                        setSelectedModule(module.name)
                        setSelectedSubmodule(module.submodules?.[0] || '')
                        setError('')
                        setStep(2)
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.22, ease: 'easeOut', delay: index * 0.04 }}
                      whileHover={{ y: -2 }}
                      className={`flex min-h-[88px] items-center justify-between rounded-[1.25rem] border px-5 py-4 text-left transition-shadow hover:shadow-md ${isSelected ? activeTone : tone}`}
                    >
                      <div>
                        <p className="text-lg font-light capitalize">{module.name}</p>
                        <p className="mt-1 text-sm opacity-80">{module.submodules.length} submodules</p>
                      </div>
                      <Squares2X2Icon className="h-7 w-7 opacity-90" />
                    </motion.button>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-light text-slate-700">{selectedModuleData?.name}</div>
                  <button type="button" onClick={() => setStep(1)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-light text-slate-600 transition hover:border-slate-300">Back</button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedModuleSubmodules.map((submodule, index) => {
                    const isSelected = selectedSubmodule === submodule
                    return (
                      <motion.button
                        key={submodule}
                        type="button"
                        onClick={() => {
                          setSelectedSubmodule(submodule)
                          setStep(3)
                        }}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.22, ease: 'easeOut', delay: index * 0.04 }}
                        whileHover={{ y: -2 }}
                        className={`rounded-[1.25rem] border px-4 py-4 text-left transition-shadow hover:shadow-md ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-light text-slate-900">{submodule}</p>
                            <p className="text-sm text-slate-500">Click to continue</p>
                          </div>
                          <TagIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-light text-blue-700">
            {activeOrganization.organizationName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          {step === 3 ? (
            <section className="mt-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">Transaction form</p>
                    <h2 className="mt-2 text-2xl font-light tracking-tight text-slate-900">{selectedModuleData?.name} · {selectedSubmodule}</h2>
                  </div>
                  <button type="button" onClick={() => setStep(2)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-light text-slate-600">Back</button>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-light text-slate-700">Enter Amount</label>
                    <div className="relative rounded-xl border border-blue-500 bg-white px-3 py-2.5 shadow-[0_0_0_1px_rgba(59,130,246,0.08)] focus-within:ring-2 focus-within:ring-blue-500/20">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-light text-slate-900">{selectedCurrency?.symbol || '$'}</div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-light text-slate-500">
                        {previewAmount !== null ? formatMoney(previewAmount, selectedCurrency) : ''}
                      </div>
                      <input
                        type="text"
                        value={amountDisplayValue}
                        onChange={(event) => {
                          setAmountExpression((currentExpression) => buildAmountExpression(currentExpression, event.target.value))
                          setError('')
                        }}
                        placeholder="600"
                        className="w-full bg-transparent pl-7 pr-24 text-base font-light text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {tokens.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm font-light">
                      {tokens.map((token, index) =>
                        /\d/.test(token) ? (
                          <span key={`${token}-${index}`} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700 shadow-sm">
                            {selectedCurrency?.symbol || '$'}{token}
                            <button type="button" onClick={() => setAmountExpression(removeTokenFromExpression(amountExpression, index))} className="rounded-full p-0.5 text-blue-600 transition hover:bg-blue-100" aria-label={`Remove ${token}`}>
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
                      <label className="mb-1.5 block text-sm font-light text-slate-700">Notes (Optional)</label>
                      <input
                        type="text"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Add a short note"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-light text-slate-700">Attachment (Optional)</label>
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50">
                          <span className="inline-flex items-center gap-2">
                            <PaperClipIcon className="h-4 w-4 text-blue-600" />
                            {attachment?.name || 'Upload a file'}
                          </span>
                          <input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-light text-slate-700">Date</label>
                        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                    </div>
                  </div>

                  {error ? <p className="text-sm font-light text-rose-600">{error}</p> : null}
                  {savedMessage ? <p className="text-sm font-light text-emerald-600">{savedMessage}</p> : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" disabled={!canSave} onClick={() => saveTransaction(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-light text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                      Save
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={!canSave} onClick={() => saveTransaction(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                      Save and Add Another
                      <PlusIcon className="h-4 w-4" />
                    </button>
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
