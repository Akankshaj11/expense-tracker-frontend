// Repo file header
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiRequest } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../../utils/organizationSync'
import { getPersistedModuleTransactionType } from '../../utils/moduleUtils'
import useLanguage from '../../hooks/useLanguage'

import {
  translateText,
  translateModuleLabel,
  translateSubmoduleLabel,
} from '../../i18n/translations'

// Function: readJSON
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Function: createModuleItem
function createModuleItem(module, index, organizationSubmodules = {}) {
  const normalizedName = String(module?.name || '').toLowerCase()
  const isDefaultSystemModule = ['revenue', 'expenses', 'investments', 'lend', 'borrow'].includes(normalizedName)

  return {
    id: `${module.name}-${index}-${Date.now()}`,
    name: module.name || '',
    transactionType: getPersistedModuleTransactionType(module),
    isCustom: module?.isCustom === true || (!isDefaultSystemModule && Boolean(module?.transactionType)),
    submodules: Array.isArray(module.submodules)
      ? module.submodules
      : Array.isArray(organizationSubmodules?.[module.name])
        ? organizationSubmodules[module.name]
        : [],
  }
}

// Function: buildModuleItems
function buildModuleItems(organization) {
  return (organization?.modules || []).map((module, index) => createModuleItem(module, index, organization?.submodules || {}))
}

// Function: createEmptyModuleDraft
function createEmptyModuleDraft() {
  return {
    id: `module-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: '',
    transactionType: 'in',
    submodules: [],
    submoduleDraft: '',
  }
}

export default function ManageOrganization() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  const { language, text } = useLanguage()
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null

  const [organizationName, setOrganizationName] = useState(activeOrganization?.organizationName || '')
  const [description, setDescription] = useState(activeOrganization?.description || '')
  const [modules, setModules] = useState(() => buildModuleItems(activeOrganization))
  const [moduleDraft, setModuleDraft] = useState(null)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reload organizations from the backend on mount to ensure fresh data.
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

  useEffect(() => {
    if (!activeOrganization) {
      return
    }

    setOrganizationName(activeOrganization.organizationName || '')
    setDescription(activeOrganization.description || '')
    setModules(buildModuleItems(activeOrganization))
    setModuleDraft(null)
  }, [activeOrganization])

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.noOrganizationFound}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.createAnOrganizationFirst}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.needOrganizationBeforeManagingModules}</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25">
            {text.createOrganization}
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Function: updateModule
  const updateModule = (moduleId, key, value) => {
    setModules((current) => current.map((module) => (module.id === moduleId ? { ...module, [key]: value } : module)))
  }

  // Function: updateSubmodule
  const updateSubmodule = (moduleId, subIndex, value) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) {
          return module
        }

        const nextSubmodules = [...module.submodules]
        nextSubmodules[subIndex] = value
        return { ...module, submodules: nextSubmodules }
      }),
    )
  }

  // Function: addModule
  const addModule = () => {
    setError('')
    setSavedMessage('')
    setModuleDraft((currentDraft) => currentDraft || createEmptyModuleDraft())
  }

  // Function: cancelModuleDraft
  const cancelModuleDraft = () => {
    setModuleDraft(null)
  }

  // Function: updateModuleDraft
  const updateModuleDraft = (key, value) => {
    setModuleDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return { ...currentDraft, [key]: value }
    })
  }

  // Function: saveModuleDraft
  const saveModuleDraft = () => {
    if (!moduleDraft) {
      return
    }

    const name = moduleDraft.name.trim()
    // Function: submodules
    const submodules = (moduleDraft.submodules || []).map((submodule) => submodule.trim()).filter(Boolean)

    if (!name) {
      setError(text.moduleNameRequired)
      return
    }

    if (submodules.length === 0) {
      setError(text.addAtLeastOneSubmodule)
      return
    }

    if (modules.some((module) => module.name.toLowerCase() === name.toLowerCase())) {
      setError(text.moduleNameAlreadyExists)
      return
    }

    const nextModule = {
      id: `module-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      transactionType: moduleDraft.transactionType || 'in',
      isCustom: true,
      submodules,
    }

    setModules((current) => [...current, nextModule])
    setModuleDraft(null)
    setError('')
  }

  // Function: addModuleDraftSubmodule
  const addModuleDraftSubmodule = () => {
    setModuleDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      const nextSubmodule = currentDraft.submoduleDraft.trim()
      if (!nextSubmodule) {
        return currentDraft
      }

      if (currentDraft.submodules.some((submodule) => submodule.toLowerCase() === nextSubmodule.toLowerCase())) {
        return { ...currentDraft, submoduleDraft: '' }
      }

      return {
        ...currentDraft,
        submodules: [...currentDraft.submodules, nextSubmodule],
        submoduleDraft: '',
      }
    })
  }

  // Function: removeModuleDraftSubmodule
  const removeModuleDraftSubmodule = (submoduleValue) => {
    setModuleDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        submodules: currentDraft.submodules.filter((submodule) => submodule !== submoduleValue),
      }
    })
  }

  // Function: removeModule
  const removeModule = (moduleId) => {
    setModules((current) => current.filter((module) => module.id !== moduleId))
  }

  // Function: addSubmodule
  const addSubmodule = (moduleId) => {
    setModules((current) =>
      current.map((module) =>
        module.id === moduleId ? { ...module, submodules: ['', ...module.submodules] } : module,
      ),
    )
  }

  // Function: removeSubmodule
  const removeSubmodule = (moduleId, subIndex) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) {
          return module
        }

        return { ...module, submodules: module.submodules.filter((_, index) => index !== subIndex) }
      }),
    )
  }

  // Function: handleSave
  const handleSave = async (event) => {
    event.preventDefault()

    const normalizedModules = modules
      .map((module) => ({
        name: module.name.trim(),
        transactionType: module.transactionType || 'in',
        isCustom: module?.isCustom === true,
        submodules: module.submodules.map((submodule) => submodule.trim()).filter(Boolean),
      }))
      .filter((module) => module.name)

    if (!organizationName.trim()) {
      setError(text.organizationNameRequired)
      return
    }

    if (normalizedModules.length === 0) {
      setError(text.addAtLeastOneModule)
      return
    }

    if (normalizedModules.some((module) => module.submodules.length === 0)) {
      setError(text.eachModuleNeedsAtLeastOneSubmodule)
      return
    }

    // Transform modules structure: separate module names from submodules dict
    const modulesForBackend = normalizedModules.map((module) => ({
      name: module.name,
      transactionType: module.transactionType,
      moduleType: module.transactionType,
      isCustom: module.isCustom,
    }))
    const submodulesForBackend = {}
    normalizedModules.forEach((module) => {
      submodulesForBackend[module.name] = module.submodules
    })

    const updatePayload = {
      organizationName: organizationName.trim(),
      description: description.trim(),
      modules: modulesForBackend,
      submodules: submodulesForBackend,
    }

    // Check if this is a local ID (from offline mode) or a MongoDB ObjectId
    const isMongoId = /^[a-f0-9]{24}$/.test(activeOrganization.id)

    try {
      let updatedOrg = null

      if (isMongoId) {
        // Call backend for MongoDB-backed organization
        const response = await apiRequest(`/organizations/${activeOrganization.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        })
        updatedOrg = response?.data || null
      } else {
        // For local IDs (offline mode), just update localStorage
        updatedOrg = {
          ...activeOrganization,
          ...updatePayload,
          updatedAt: new Date().toISOString(),
        }
      }

      if (updatedOrg) {
        const updatedOrganizations = organizations.map((org) =>
          org.id === activeOrganization.id
            ? {
              ...org,
              organizationName: updatedOrg.organizationName,
              description: updatedOrg.description,
              modules: updatedOrg.modules,
              submodules: updatedOrg.submodules,
            }
            : org,
        )

        localStorage.setItem('organizations', JSON.stringify(updatedOrganizations))
        localStorage.setItem('organization', JSON.stringify(updatedOrg))
        localStorage.setItem('activeOrgId', updatedOrg.id)

        setError('')
        setSavedMessage(text.organizationUpdatedSuccessfully)
        setTimeout(() => {
          navigate('/dashboard')
        }, 800)
      }
    } catch (err) {
      setError(err?.message || text.unableToSaveOrganization)
    }
  }

  // Function: handleDelete
  const handleDelete = async () => {
    setIsDeleting(true)
    const isMongoId = /^[a-f0-9]{24}$/.test(activeOrganization.id)

    try {
      if (isMongoId) {
        // Call backend to delete
        await apiRequest(`/organizations/${activeOrganization.id}`, {
          method: 'DELETE',
        })
      }

      // Remove from localStorage
      const updatedOrganizations = organizations.filter((org) => org.id !== activeOrganization.id)
      localStorage.setItem('organizations', JSON.stringify(updatedOrganizations))

      // Clear active org if it was the deleted one
      if (localStorage.getItem('activeOrgId') === activeOrganization.id) {
        localStorage.removeItem('organization')
        localStorage.removeItem('activeOrgId')
      }

      setError('')
      setSavedMessage(text.organizationDeletedSuccessfully)
      setDeleteConfirmOpen(false)

      setTimeout(() => {
        if (updatedOrganizations.length === 0) {
          navigate('/create-organization')
        } else {
          navigate('/dashboard')
        }
      }, 800)
    } catch (err) {
      setIsDeleting(false)
      const errorMsg = err?.message || text.unableToDeleteOrganization
      setError(errorMsg)
      setDeleteConfirmOpen(false)
    }
  }

  return (
    <div className="theme-light-violet min-h-screen px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <ArrowLeftIcon className="h-4 w-4" />
            {text.backToDashboard}
          </Link>
          <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
            {activeOrganization.organizationName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="inner-card-accent rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 border-b border-white/4 pb-6">
            <p className="text-sm font-light uppercase tracking-[0.26em] text-primary-600">{text.manageOrganization}</p>
            <h1 className="text-3xl font-light tracking-tight text-[var(--text)]">{activeOrganization.organizationName}</h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--muted)]">{text.manageOrganizationDescription}</p>
          </div>

          <form onSubmit={handleSave} className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">{text.organizationNameLabel}</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">{text.descriptionLabel}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-light text-[var(--text)]">{text.modulesAndSubmodules}</h2>
                <p className="text-sm text-slate-500">{text.editEveryModuleDirectly}</p>
              </div>
              <button
                type="button"
                onClick={addModule}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-light text-primary-700 transition hover:bg-primary-100"
              >
                {text.addModule}
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {moduleDraft ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4 backdrop-blur-sm"
                onClick={cancelModuleDraft}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="inner-card-accent w-full max-w-md rounded-[1.5rem] border border-white/80 bg-[var(--card)] p-3 shadow-glass sm:p-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/60 pb-3">
                    <div>
                      <p className="text-[10px] font-light uppercase tracking-[0.28em] text-primary-600">{text.addModule}</p>
                      <h3 className="mt-1.5 text-xl font-light tracking-tight text-[var(--text)]">{text.createNewModule}</h3>
                      {/* <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">Enter the module details, choose the type, and add submodules before saving.</p> */}
                    </div>
                    <button
                      type="button"
                      onClick={cancelModuleDraft}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      aria-label={text.closeModuleForm}
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-light text-slate-700">{text.moduleNameLabel}</label>
                        <input
                          type="text"
                          value={moduleDraft.name}
                          onChange={(event) => updateModuleDraft('name', event.target.value)}
                          className="w-full rounded-xl border border-dashed border-primary-300 bg-primary-50/70 px-3 py-2.5 text-sm font-light text-[var(--text)] outline-none transition focus:border-primary-500 focus:bg-[var(--card)] focus:ring-2 focus:ring-primary-500/20 input-glass"
                          placeholder={
                            module.isCustom
                              ? text.moduleNamePlaceholder
                              : translateModuleLabel(language, module.name)
                          }
                        />
                      </div>

                      <div>
                        <p className="text-xs font-light uppercase tracking-[0.16em] text-slate-500">{text.moduleTypeLabel}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            { value: 'revenue', label: text.revenue, activeClass: 'border-emerald-500 bg-emerald-500 text-white shadow-sm' },
                            { value: 'expense', label: text.expenses, activeClass: 'border-red-500 bg-red-500 text-white shadow-sm' },
                          ].map((item) => {
                            const isActive = moduleDraft.transactionType === item.value

                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => updateModuleDraft('transactionType', item.value)}
                                className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition ${isActive ? item.activeClass : 'border-white/70 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                              >
                                {item.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-light text-slate-700">{text.submoduleNameLabel}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={moduleDraft.submoduleDraft}
                            onChange={(event) => updateModuleDraft('submoduleDraft', event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                addModuleDraftSubmodule()
                              }
                            }}
                            className="w-full rounded-xl border border-dashed border-primary-300 bg-primary-50/70 px-3 py-2.5 text-sm font-light text-[var(--text)] outline-none transition focus:border-primary-500 focus:bg-[var(--card)] focus:ring-2 focus:ring-primary-500/20"
                            placeholder={text.submoduleNamePlaceholder}
                          />
                          <button
                            type="button"
                            onClick={addModuleDraftSubmodule}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-600 transition hover:bg-primary-100"
                            aria-label={text.addSubmodule}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {moduleDraft.submodules.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {moduleDraft.submodules.map((submodule) => (
                          <span key={translateSubmoduleLabel(language, submodule)} className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-light text-slate-700 shadow-sm ring-1 ring-slate-200">
                            {translateSubmoduleLabel(language, submodule)}
                            <button
                              type="button"
                              onClick={() => removeModuleDraftSubmodule(submodule)}
                              className="text-slate-400 transition hover:text-rose-600"
                              aria-label={translateText(language, 'removeSubmodule', { submodule })}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/60 pt-4">
                      <button
                        type="button"
                        onClick={cancelModuleDraft}
                        className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {text.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={saveModuleDraft}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
                      >
                        {text.saveModule}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : null}

            <ul className="grid gap-4 sm:grid-cols-2">
              {modules.map((module, moduleIndex) => (
                <li key={module.id} className="rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-4">
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-slate-500">{translateText(language, 'moduleLabelWithNumber', { number: moduleIndex + 1 })}</label>
                      {
                        (() => {
                          const translatedModule = translateModuleLabel(language, module.name)
                          return translatedModule && translatedModule !== module.name ? (
                            <p className="mb-2 text-sm font-light text-primary-600">{module.name} <span className="text-xs text-primary-600">({translatedModule})</span></p>
                          ) : null
                        })()
                      }
                      <input
                        type="text"
                        value={module.name}
                        onChange={(event) => updateModule(module.id, 'name', event.target.value)}
                        className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                        placeholder={
                          module.isCustom
                            ? text.moduleNamePlaceholder
                            : translateModuleLabel(language, module.name)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModule(module.id)}
                      className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      aria-label={translateText(language, 'deleteModule', { module: module.name || moduleIndex + 1 })}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 pl-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-light uppercase tracking-[0.18em] text-slate-500">{text.submodules}</p>
                      <button
                        type="button"
                        onClick={() => addSubmodule(module.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-3 py-2 text-xs font-light text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        {text.addSubmodule}
                      </button>
                    </div>

                    <ul className="space-y-3 border-l border-dashed border-slate-300 pl-4">
                      {module.submodules.map((submodule, subIndex) => (
                        <li key={`${module.id}-${subIndex}`} className="flex items-center gap-2">
                          {/* {!module.isCustom ? (
                            <p className="mb-1 text-xs font-light text-primary-600">
                              {translateSubmoduleLabel(language, submodule)}
                            </p>
                          ) : null} */}
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
                              <input
                                type="text"
                                value={submodule}
                                onChange={(event) => updateSubmodule(module.id, subIndex, event.target.value)}
                                className="min-w-0 flex-1 rounded-xl text-slate-400 border border-white/6 bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                placeholder={
                                  translateSubmoduleLabel(language, submodule) ||
                                  translateText(language, 'submoduleNumberPlaceholder', {
                                    number: subIndex + 1,
                                  })
                                }
                              />
                              {
                                (() => {
                                  const translatedSub = translateSubmoduleLabel(language, submodule)
                                  return translatedSub && translatedSub !== submodule ? (
                                    <span className="ml-2 text-xs font-light text-primary-600">({translatedSub})</span>
                                  ) : null
                                })()
                              }
                          <button
                            type="button"
                            onClick={() => removeSubmodule(module.id, subIndex)}
                            className="rounded-xl border border-white/6 bg-[var(--card)] p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={text.removeSubmodule}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>

            {error ? <p className="text-sm font-light text-rose-600">{error}</p> : null}
            {savedMessage ? <p className="text-sm font-light text-emerald-600">{savedMessage}</p> : null}

            <div className="flex flex-col gap-4 border-t border-white/6 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-light text-rose-600 transition hover:bg-rose-100"
              >
                <TrashIcon className="h-4 w-4" />
                {text.deleteOrganization}
              </button>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full accent-cta px-6 py-3 text-sm font-light transition hover:-translate-y-0.5">
                {text.saveChanges}
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </motion.div>

        {deleteConfirmOpen ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="inner-card-accent w-full max-w-md rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-lg sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-light text-[var(--text)]">{text.deleteOrganization}</h2>
                <p className="mt-2 text-base leading-7 text-[var(--muted)]">{translateText(language, 'deleteOrganizationConfirmation', { organization: activeOrganization.organizationName })}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-full border border-white/6 bg-[var(--card)] px-6 py-3 text-sm font-light text-[var(--text)] transition hover:border-white/10 disabled:opacity-50"
                >
                  {text.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-light text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  {isDeleting ? text.deleting : text.delete}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  )
}