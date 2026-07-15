// Repo file header
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EllipsisVerticalIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { apiRequest } from '../../utils/api'
import { loadOrganizationsFromBackend } from '../../utils/organizationSync'
import { readJSON } from '../../utils/transactionHelpers'
import DashboardModuleEditor from './DashboardModuleEditor'

// Function: getModuleTypeBadge
function getModuleTypeBadge(module) {
  if (!(module?.transactionType || module?.direction)) {
    return null
  }

  const transactionType = String(module.transactionType || module.direction || '').toLowerCase()

  if (['revenue', 'in', 'income', 'credit'].includes(transactionType)) {
    return {
      label: 'I',
      className: 'bg-emerald-500 text-white',
      ariaLabel: 'In module',
      title: 'In module',
    }
  }

  if (['expenses', 'out', 'expense', 'debit', 'investments', 'investment'].includes(transactionType)) {
    return {
      label: 'O',
      className: 'bg-rose-500 text-white',
      ariaLabel: 'Out module',
      title: 'Out module',
    }
  }

  return null
}

export default function DashboardModulesSection({ text, moduleCards, onModuleClick, activeOrganization, organizations, setOrganizations }) {
  const navigate = useNavigate()
  const [openMenuId, setOpenMenuId] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingOriginalName, setEditingOriginalName] = useState('')
  const [moduleNameDraft, setModuleNameDraft] = useState('')
  const [submoduleDrafts, setSubmoduleDrafts] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const menuRefs = useRef(new Map())

  useEffect(() => {
    if (!openMenuId) {
      return undefined
    }

    // Function: handlePointerDown
    const handlePointerDown = (event) => {
      const activeMenu = menuRefs.current.get(openMenuId)
      if (activeMenu && !activeMenu.contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [openMenuId])

  // Function: handleView
  const handleView = (moduleLabel) => {
    const resolvedModuleName = String(moduleLabel || '').trim()
    if (!resolvedModuleName) {
      return
    }

    navigate(`/module/${encodeURIComponent(resolvedModuleName)}`)

    setOpenMenuId(null)
  }

  // Function: openEditor
  const openEditor = (module) => {
    try {
      console.debug('DashboardModulesSection.openEditor', module?.rawName || module?.label)
    } catch (e) { }
    setEditingOriginalName(module.rawName || '')
    setModuleNameDraft(module.label || module.rawName || '')
    setSubmoduleDrafts(Array.isArray(module.submodules) ? [...module.submodules] : [])
    setError('')
    setIsEditorOpen(true)
    setOpenMenuId(null)
  }

  // Function: closeEditor
  const closeEditor = () => {
    setIsEditorOpen(false)
    setEditingOriginalName('')
    setModuleNameDraft('')
    setSubmoduleDrafts([])
    setError('')
    setIsSaving(false)
  }

  // Function: updateSubmoduleDraft
  const updateSubmoduleDraft = (index, value) => {
    setSubmoduleDrafts((current) => current.map((submodule, subIndex) => (subIndex === index ? value : submodule)))
  }

  // Function: addSubmoduleDraft
  const addSubmoduleDraft = () => {
    setSubmoduleDrafts((current) => [...current, ''])
  }

  // Function: removeSubmoduleDraft
  const removeSubmoduleDraft = (index) => {
    setSubmoduleDrafts((current) => current.filter((_, subIndex) => subIndex !== index))
  }

  // Function: persistUpdatedOrganizations
  const persistUpdatedOrganizations = async (nextOrganizations) => {
    const activeOrgId = String(activeOrganization?.id || '')
    const activeOrg = nextOrganizations.find((org) => String(org.id) === activeOrgId)
    if (!activeOrg) {
      return
    }

    // Function: modulesForBackend
    const modulesForBackend = (activeOrg.modules || []).map((module) => ({
      name: module.name,
      transactionType: module.transactionType || 'in',
      isCustom: module?.isCustom === true,
      submodules: Array.isArray(module.submodules) ? module.submodules : [],
    }))
    const submodulesMap = {}
    modulesForBackend.forEach((module) => {
      submodulesMap[module.name] = Array.isArray(module.submodules) ? module.submodules : []
    })

    await apiRequest(`/organizations/${encodeURIComponent(activeOrg.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }),
    })

    localStorage.setItem('organizations', JSON.stringify(nextOrganizations))
    localStorage.setItem('organization', JSON.stringify(activeOrg))

    if (typeof setOrganizations === 'function') {
      setOrganizations(nextOrganizations)
    }

    try {
      const refreshed = await loadOrganizationsFromBackend()
      if (!Array.isArray(refreshed) || refreshed.length === 0) {
        return
      }

      const refreshedActiveOrg = refreshed.find((org) => String(org.id) === activeOrgId) || refreshed[0]
      const mergedOrganizations = refreshed.map((org) => (String(org.id) === activeOrgId ? refreshedActiveOrg : org))

      localStorage.setItem('organizations', JSON.stringify(mergedOrganizations))
      localStorage.setItem('organization', JSON.stringify(refreshedActiveOrg))

      if (typeof setOrganizations === 'function') {
        setOrganizations(mergedOrganizations)
      }
    } catch {
      // Keep optimistic local state when refresh fails
    }
  }

  // Function: handleSave
  const handleSave = async () => {
    if (!activeOrganization) {
      return
    }

    const nextName = moduleNameDraft.trim()
    const nextSubmodules = submoduleDrafts.map((submodule) => submodule.trim()).filter(Boolean)

    if (!nextName) {
      setError(text.moduleNameRequired)
      return
    }

    if (nextSubmodules.length === 0) {
      setError(text.addAtLeastOneSubmodule)
      return
    }

    const activeModules = Array.isArray(activeOrganization.modules) ? [...activeOrganization.modules] : []
    const originalName = String(editingOriginalName || '').trim()
    const duplicateExists = activeModules.some((module) => {
      const normalized = String(module.name || '').trim().toLowerCase()
      return normalized === nextName.toLowerCase() && normalized !== originalName.toLowerCase()
    })

    if (duplicateExists) {
      setError(text.moduleNameAlreadyExists || 'Module name already exists')
      return
    }

    const nextModules = activeModules.map((module) => {
      if (String(module.name || '') !== originalName) {
        return module
      }

      return {
        ...module,
        name: nextName,
        transactionType: module.transactionType || 'in',
        submodules: nextSubmodules,
      }
    })

    // Function: nextOrganizations
    const nextOrganizations = (readJSON('organizations', []) || []).map((organization) => {
      if (organization.id !== activeOrganization.id) {
        return organization
      }

      const nextSubmoduleMap = {}
      nextModules.forEach((module) => {
        nextSubmoduleMap[module.name] = Array.isArray(module.submodules) ? module.submodules : []
      })

      return {
        ...organization,
        modules: nextModules,
        submodules: nextSubmoduleMap,
      }
    })

    try {
      setIsSaving(true)
      await persistUpdatedOrganizations(nextOrganizations)

      const transactions = readJSON('transactions', [])
      const moduleRenameMap = new Map()
      moduleRenameMap.set(originalName, nextName)
      const submoduleRenameMap = new Map()
      moduleCards
        .find((item) => item.rawName === originalName)
        ?.rawSubmodules?.forEach((oldSubmodule, index) => {
          const newSubmodule = nextSubmodules[index]
          if (newSubmodule && newSubmodule !== oldSubmodule) {
            submoduleRenameMap.set(oldSubmodule, newSubmodule)
          }
        })

      const updatedTransactions = transactions.map((transaction) => {
        if (transaction.organizationId && transaction.organizationId !== activeOrganization.id) {
          return transaction
        }

        if (String(transaction.module || '') !== originalName) {
          return transaction
        }

        const nextTransaction = { ...transaction, module: nextName }
        const mappedSubmodule = submoduleRenameMap.get(transaction.submodule)
        if (mappedSubmodule) {
          nextTransaction.submodule = mappedSubmodule
        }
        return nextTransaction
      })

      localStorage.setItem('transactions', JSON.stringify(updatedTransactions))
      closeEditor()
    } catch (saveError) {
      setError(saveError?.message || text.unableToSaveOrganization || 'Unable to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  // Function: handleDelete
  const handleDelete = async (module, event) => {
    event?.stopPropagation()

    try {
      console.debug('DashboardModulesSection.handleDelete', module?.rawName || module?.label)
    } catch (e) { }

    const moduleName = String(module.rawName || module.label || '').trim()
    if (!moduleName || !activeOrganization?.id) {
      setOpenMenuId(null)
      return
    }

    const moduleLabel = module.label || moduleName
    const confirmed = window.confirm(`Delete module "${moduleLabel}"? This cannot be undone.`)
    if (!confirmed) {
      setOpenMenuId(null)
      return
    }

    const activeOrgId = String(activeOrganization.id)
    const sourceOrganizations = Array.isArray(organizations) && organizations.length > 0 ? organizations : readJSON('organizations', [])
    const currentOrg = sourceOrganizations.find((org) => String(org.id) === activeOrgId)
    const activeModules = Array.isArray(currentOrg?.modules) ? currentOrg.modules : []

    if (activeModules.length <= 1) {
      alert(text.addAtLeastOneModule || 'At least one module is required')
      setOpenMenuId(null)
      return
    }

    const normalizedModuleName = moduleName.toLowerCase()
    const nextModules = activeModules.filter(
      (item) => String(item.name || '').trim().toLowerCase() !== normalizedModuleName,
    )

    if (nextModules.length === activeModules.length) {
      alert(text.unableToSaveOrganization || 'Unable to delete this module')
      setOpenMenuId(null)
      return
    }

    const nextSubmodulesMap = {}
    nextModules.forEach((item) => {
      nextSubmodulesMap[item.name] = Array.isArray(item.submodules) ? item.submodules : []
    })

    const nextOrganizations = sourceOrganizations.map((organization) => {
      if (String(organization.id) !== activeOrgId) {
        return organization
      }

      return {
        ...organization,
        modules: nextModules,
        submodules: nextSubmodulesMap,
      }
    })

    try {
      await persistUpdatedOrganizations(nextOrganizations)

      const transactions = readJSON('transactions', [])
      const nextTransactions = transactions.filter((transaction) => {
        if (transaction.organizationId && String(transaction.organizationId) !== activeOrgId) {
          return true
        }

        return String(transaction.module || '').trim().toLowerCase() !== normalizedModuleName
      })
      localStorage.setItem('transactions', JSON.stringify(nextTransactions))
      window.dispatchEvent(new Event('transactions:updated'))
    } catch {
      alert(text.unableToSaveOrganization || 'Unable to save organization changes')
    } finally {
      setOpenMenuId(null)
    }
  }

  return (
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

      <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {moduleCards.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: index * 0.05, duration: 0.45 }}
            // onClick={(e) => {
            //   if (openMenuId === module.id) {
            //     // if menu for this module is open, ignore article clicks
            //     return
            //   }
            //   navigate(`/module/${encodeURIComponent(module.rawName || module.label || '')}`)
            // }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (openMenuId === module.id) return
                navigate(`/module/${encodeURIComponent(module.rawName || module.label || '')}`)
              }
            }}
            className="relative flex h-full cursor-pointer flex-col rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {(() => {
              const typeBadge = getModuleTypeBadge(module)

              return (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl p-3" style={{ backgroundColor: module.theme.iconBg, color: module.theme.fg }}>
                      <module.theme.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-light capitalize text-[var(--text)]">{module.label}</p>
                        {typeBadge ? (
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${typeBadge.className}`}
                            aria-label={typeBadge.ariaLabel}
                            title={typeBadge.title}
                          >
                            {typeBadge.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-500">{module.submodules.length} {text.submodules.toLowerCase()}</p>
                    </div>
                  </div>
                  <div
                    ref={(node) => {
                      if (node) {
                        menuRefs.current.set(module.id, node)
                      } else {
                        menuRefs.current.delete(module.id)
                      }
                    }}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setOpenMenuId(openMenuId === module.id ? null : module.id)
                      }}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-[var(--card)] hover:text-[var(--muted)]"
                      aria-label="Module actions"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>

                    {openMenuId === module.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-white/6 bg-[var(--card)] py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            handleView(module.rawName)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-white/5"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            openEditor(module)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDelete(module, event)}
                          className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-white/5"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })()}


            <div
              onClick={() =>
                navigate(`/module/${encodeURIComponent(module.rawName || module.label || '')}`)
              }
              className="mt-5 cursor-pointer"
            >
              <div className="flex items-end justify-between gap-4">
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


            </div>

            {module.recentTransaction ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-light text-[var(--text)]">{module.recentTransaction.submodule}</span>
                  <span className={module.recentTransaction.amountValue < 0 ? 'shrink-0 font-light text-rose-600' : 'shrink-0 font-light text-emerald-600'}>
                    {module.recentTransaction.amount}
                  </span>
                </div>
              </div>
            ) : null}

          </motion.div>
        ))}
      </div>

      <DashboardModuleEditor
        text={text}
        isOpen={isEditorOpen}
        onClose={closeEditor}
        moduleNameDraft={moduleNameDraft}
        setModuleNameDraft={setModuleNameDraft}
        submoduleDrafts={submoduleDrafts}
        addSubmoduleDraft={addSubmoduleDraft}
        updateSubmoduleDraft={updateSubmoduleDraft}
        removeSubmoduleDraft={removeSubmoduleDraft}
        isSaving={isSaving}
        error={error}
        onSave={handleSave}
      />
    </section>
  )
}