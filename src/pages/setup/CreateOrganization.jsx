// Repo file header
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api'
import { translateModuleLabel, translateText } from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'

const revenueModules = ['Salary', 'Freelance', 'Bonus', 'Interest', 'Commission']
const expenseModules = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Rent', 'Subscriptions', 'Loans', 'Taxes']
const investmentModules = ['Mutual Funds', 'Stocks', 'Crypto', 'Fixed Deposits', 'Gold']

// Add a predefined "Investment Returns" module (treated as an "in" type)
const MODULE_LIST = ['Revenue', 'Expenses', 'Investments', 'Investment Returns', 'Lend', 'Borrow', 'custom']
const defaultSelectedModules = ['Revenue', 'Expenses', 'Investments', 'Investment Returns', 'Lend', 'Borrow']

function createEmptyModuleState() {
  return Object.fromEntries(MODULE_LIST.map((module) => [module, []]))
}

function createEmptyDraftState() {
  return Object.fromEntries(MODULE_LIST.map((module) => [module, '']))
}

function createCustomCard() {
  return {
    id: `custom-card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    checked: false,
    name: '',
    transactionType: 'in',
    submoduleDraft: '',
    submodules: [],
  }
}

export default function CreateOrganization() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language, text } = useLanguage()
  const [organizationName, setOrganizationName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedModules, setSelectedModules] = useState(defaultSelectedModules)
  const [customCards, setCustomCards] = useState(() => [createCustomCard()])

  const [submodules, setSubmodules] = useState(() => ({
    ...createEmptyModuleState(),
    Revenue: [...revenueModules],
    Expenses: [...expenseModules],
    Investments: [...investmentModules],
    'Investment Returns': [...investmentModules],
    Lend: ['Friends', 'Family', 'Colleagues'],
    Borrow: ['Friends', 'Family', 'Colleagues'],
  }))
  const [submoduleDrafts, setSubmoduleDrafts] = useState(() => createEmptyDraftState())
  const [error, setError] = useState('')

  const moduleItems = useMemo(() => MODULE_LIST.filter((module) => module !== 'custom'), [])
  const backPath = location.state?.from || '/select-language'

  const toggleModule = (module) => {
    setSelectedModules((current) => {
      if (current.includes(module)) {
        return current.filter((item) => item !== module)
      }
      return [...current, module]
    })
  }

  const allSelected = moduleItems.every((module) => selectedModules.includes(module))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedModules([])
    } else {
      setSelectedModules(moduleItems)
    }
  }

  const toggleCustomCard = (index) => {
    setCustomCards((current) => {
      const nextCards = current.map((card, cardIndex) => (
        cardIndex === index ? { ...card, checked: !card.checked } : card
      ))

      if (!nextCards[index].checked) {
        return nextCards.slice(0, index + 1)
      }

      if (index === nextCards.length - 1) {
        return [...nextCards, createCustomCard()]
      }

      return nextCards
    })
  }

  const updateCustomCard = (index, key, value) => {
    setCustomCards((current) => current.map((card, cardIndex) => (
      cardIndex === index ? { ...card, [key]: value } : card
    )))
  }

  const addCustomCardSubmodule = (index) => {
    setCustomCards((current) => current.map((card, cardIndex) => {
      if (cardIndex !== index) {
        return card
      }

      const nextSubmodule = card.submoduleDraft.trim()
      if (!nextSubmodule) {
        return card
      }

      if (card.submodules.includes(nextSubmodule)) {
        return { ...card, submoduleDraft: '' }
      }

      return {
        ...card,
        submodules: [...card.submodules, nextSubmodule],
        submoduleDraft: '',
      }
    }))
  }

  const removeCustomCardSubmodule = (index, value) => {
    setCustomCards((current) => current.map((card, cardIndex) => (
      cardIndex === index
        ? { ...card, submodules: card.submodules.filter((item) => item !== value) }
        : card
    )))
  }

  const addSubmodule = (module) => {
    const draft = submoduleDrafts[module]?.trim()
    if (!draft) return

    setSubmodules((current) => ({
      ...current,
      [module]: current[module].includes(draft) ? current[module] : [...current[module], draft],
    }))
    setSubmoduleDrafts((current) => ({ ...current, [module]: '' }))
  }

  const removeSubmodule = (module, value) => {
    setSubmodules((current) => ({
      ...current,
      [module]: current[module].filter((item) => item !== value),
    }))
  }

  const handleCreateOrganization = async (e) => {
    e.preventDefault()
    setError('')

    if (!organizationName.trim()) {
      setError(text.organizationNameRequired)
      return
    }

    const missingSubmoduleModules = selectedModules.filter((module) => submodules[module].length === 0)
    if (missingSubmoduleModules.length > 0) {
      const readableModules = missingSubmoduleModules.map((module) => translateModuleLabel(language, module)).join(', ')
      setError(translateText(language, 'addAtLeastOneSubmoduleUnder', { modules: readableModules }))
      return
    }

    const checkedCustomCards = customCards.filter((card) => card.checked)
    const customNameErrors = checkedCustomCards.filter((card) => !card.name.trim())
    if (customNameErrors.length > 0) {
      setError(text.customModuleNameRequired)
      return
    }

    const customSubmoduleErrors = checkedCustomCards.filter((card) => card.submodules.length === 0)
    if (customSubmoduleErrors.length > 0) {
      const readableModules = customSubmoduleErrors.map((card) => card.name.trim()).filter(Boolean).join(', ')
      setError(translateText(language, 'addAtLeastOneSubmoduleUnder', { modules: readableModules }))
      return
    }

    const selectedModuleNames = new Set(selectedModules.map((module) => module.trim().toLowerCase()))
    const customNames = new Set()
    const duplicateCustomModule = checkedCustomCards.find((card) => {
      const normalizedName = card.name.trim().toLowerCase()
      if (!normalizedName) {
        return false
      }

      if (selectedModuleNames.has(normalizedName) || customNames.has(normalizedName)) {
        return true
      }

      customNames.add(normalizedName)
      return false
    })

    if (duplicateCustomModule) {
      setError(text.moduleNameAlreadyExists)
      return
    }

    const activeModules = selectedModules.map((module) => {
      if (module === 'Investment Returns') {
        return {
          name: module,
          transactionType: 'in',
          moduleType: 'in',
          isCustom: false,
          submodules: submodules[module] || [],
        }
      }

      return {
        name: module,
        submodules: submodules[module] || [],
      }
    })

    const customModules = checkedCustomCards.map((card) => ({
      name: card.name.trim(),
      transactionType: card.transactionType,
      moduleType: card.transactionType,
      isCustom: true,
      submodules: card.submodules,
    }))

    if (activeModules.length === 0 && customModules.length === 0) {
      setError(text.pleaseSelectAtLeastOneModule)
      return
    }

    const selectedCurrency = JSON.parse(localStorage.getItem('selectedCurrency') || 'null')

    const organizationPayload = {
      organizationName: organizationName.trim(),
      description: description.trim(),
      currency: selectedCurrency,
      modules: [...activeModules, ...customModules],
      submodules,
    }

    let savedOrganization = null

    try {
      const response = await apiRequest('/organizations', {
        method: 'POST',
        body: JSON.stringify(organizationPayload),
      })

      savedOrganization = response?.data || null
    } catch (requestError) {
      setError(requestError.message || text.unableToSaveOrganization)
      return
    }

    const organization = savedOrganization || {
      id: Date.now().toString(),
      ...organizationPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem('organizationDraft', JSON.stringify(organization))
    const onboardingUser = JSON.parse(sessionStorage.getItem('onboardingUser') || 'null')
    if (onboardingUser) {
      localStorage.setItem('currentUser', JSON.stringify(onboardingUser))
      sessionStorage.removeItem('onboardingUser')
    }
    const storedOrganizations = JSON.parse(localStorage.getItem('organizations') || '[]')
    const existingOrganization = JSON.parse(localStorage.getItem('organization') || 'null')
    const normalizedExistingOrganizations = storedOrganizations.length > 0
      ? storedOrganizations
      : existingOrganization
        ? [{ ...existingOrganization, id: existingOrganization.id || Date.now().toString() }]
        : []

    localStorage.setItem('organizations', JSON.stringify([...normalizedExistingOrganizations, organization]))
    localStorage.setItem('activeOrgId', organization.id)
    localStorage.setItem('organization', JSON.stringify(organization))
    navigate('/dashboard')
  }

  return (
    <div className="theme-light-violet relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-white to-sky-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-primary-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex w-full min-h-[calc(100vh-6rem)] items-center justify-center px-2 sm:px-4 lg:px-0"
      >
        <div className="inner-card-accent w-full max-w-3xl rounded-[2rem] border border-white/80 bg-[var(--card)] p-5 shadow-glass sm:p-8">
          <div className="mb-6 flex justify-start">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {text.backLabel}
            </button>
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-primary-600">{text.setupStep3Of3}</p>
            <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">{text.createOrganizationTitle}</h1>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.createOrganizationDescription}</p>
          </div>

          <form onSubmit={handleCreateOrganization} className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">{text.organizationNameLabel}</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                  placeholder={text.organizationNamePlaceholder}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">{text.descriptionLabel}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                  placeholder={text.descriptionPlaceholder}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-light text-slate-700">{text.selectModulesTitle}</label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`inline-flex h-9 w-9 items-center justify-center border transition ${allSelected ? 'border-primary-200 bg-primary-100 text-primary-700 shadow-sm' : 'border-transparent bg-transparent text-primary-600 hover:border-primary-100 hover:bg-primary-50'}`}
                  aria-label={allSelected ? text.deselectAllModules : text.selectAllModules}
                >
                  {allSelected ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M8 12.5l2.2 2.2L16.5 8.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {moduleItems.map((module) => {
                  const isSelected = selectedModules.includes(module)
                  const draftValue = submoduleDrafts[module]
                  const moduleSubmodules = submodules[module]

                  return (
                    <div
                      key={module}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleModule(module)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleModule(module)
                        }
                      }}
                      className={`relative rounded-xl border p-4 transition ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-white/6 bg-[var(--card)]'} cursor-pointer`}
                    >
                      <div className="flex items-start justify-between gap-3 pr-8">
                        <div onClick={(event) => event.stopPropagation()}>
                          <p className="text-base font-light capitalize text-[var(--text)]">{translateModuleLabel(language, module)}</p>
                        </div>

                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModule(module)}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-4 top-4 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>

                      {isSelected ? (
                        <div className="mt-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={draftValue}
                              onChange={(e) => setSubmoduleDrafts((current) => ({ ...current, [module]: e.target.value }))}
                              onKeyDown={(event) => {
                                event.stopPropagation()
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  addSubmodule(module)
                                }
                              }}
                              onClick={(event) => event.stopPropagation()}
                              className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                              placeholder={translateText(language, 'addSubmoduleFor', { module: translateModuleLabel(language, module) })}
                            />
                            <button
                              type="button"
                              onMouseDown={(event) => event.stopPropagation()}
                              onClick={(event) => {
                                event.stopPropagation()
                                addSubmodule(module)
                              }}
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-600 transition hover:bg-primary-100"
                              aria-label={translateText(language, 'addSubmoduleTo', { module: translateModuleLabel(language, module) })}
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>

                          {moduleSubmodules.length > 0 ? (
                            <div className="no-scrollbar mt-3 overflow-x-auto pb-1">
                              <div className="flex w-max gap-2 pr-2">
                                {moduleSubmodules.map((item) => (
                                  <span key={item} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-light text-slate-700 shadow-sm ring-1 ring-slate-200">
                                    {item}
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        removeSubmodule(module, item)
                                      }}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      className="text-slate-400 transition hover:text-red-500"
                                      aria-label={translateText(language, 'removeSubmoduleFrom', { item, module: translateModuleLabel(language, module) })}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}

                {customCards.map((card, index) => {
                  return (
                    <div
                      key={card.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleCustomCard(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleCustomCard(index)
                        }
                      }}
                      className={`relative rounded-xl border p-4 transition ${card.checked ? 'border-primary-500 bg-primary-50' : 'border-white/6 bg-[var(--card)]'} cursor-pointer`}
                    >
                      <div className="flex items-start justify-between gap-3 pr-8">
                        <div onClick={(event) => event.stopPropagation()}>
                          <div className="space-y-4">
                            <div className="inline-flex max-w-[200px] rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/70 px-2 py-1 transition focus-within:border-primary-500 focus-within:bg-[var(--card)]">
                              <input
                                type="text"
                                value={card.name}
                                onChange={(event) => updateCustomCard(index, 'name', event.target.value)}
                                className="w-full bg-transparent px-1 text-sm font-light text-[var(--text)] outline-none placeholder:text-slate-400"
                                placeholder={text.customModulePlaceholder}
                              />
                            </div>

                            {card.checked ? (
                              <div className="space-y-2">
                                <p className="my-0 text-xs font-light uppercase tracking-[0.16em] text-slate-500">Module Type</p>
                                <div className="flex gap-2">
                                  {[
                                    { value: 'in', label: 'In', selectedClass: 'border-emerald-500 bg-emerald-500 text-white shadow-sm' },
                                    { value: 'out', label: 'Out', selectedClass: 'border-red-500 bg-red-500 text-white shadow-sm' },
                                  ].map((item) => {
                                    const isActive = card.transactionType === item.value

                                    return (
                                      <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => updateCustomCard(index, 'transactionType', item.value)}
                                        className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] transition ${isActive ? item.selectedClass : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                                      >
                                        {item.label}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={card.checked}
                          onChange={() => toggleCustomCard(index)}
                          onClick={(event) => event.stopPropagation()}
                          className="absolute right-4 top-4 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>

                      {card.checked ? (
                        <div className="mt-3">
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={card.submoduleDraft}
                                onChange={(event) => updateCustomCard(index, 'submoduleDraft', event.target.value)}
                                onKeyDown={(event) => {
                                  event.stopPropagation()
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    addCustomCardSubmodule(index)
                                  }
                                }}
                                onClick={(event) => event.stopPropagation()}
                                className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                placeholder={text.addSubmoduleForCustom}
                              />
                              <button
                                type="button"
                                onMouseDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  addCustomCardSubmodule(index)
                                }}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-600 transition hover:bg-primary-100"
                                aria-label={translateText(language, 'addSubmoduleTo', { module: card.name.trim() || text.customModulePlaceholder })}
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {card.submodules.length > 0 ? (
                            <div className="no-scrollbar mt-3 overflow-x-auto pb-1">
                              <div className="flex w-max gap-2 pr-2">
                                {card.submodules.map((item) => (
                                  <span key={item} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-light text-slate-700 shadow-sm ring-1 ring-slate-200">
                                    {item}
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        removeCustomCardSubmodule(index, item)
                                      }}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      className="text-slate-400 transition hover:text-red-500"
                                      aria-label={translateText(language, 'removeSubmoduleFrom', { item, module: card.name.trim() || text.customModulePlaceholder })}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                {text.createOrganizationButton}
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
