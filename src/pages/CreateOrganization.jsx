import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

const defaultModules = ['lend', 'borrow', 'savings', 'investments']
const allModules = [...defaultModules, 'custom']

export default function CreateOrganization() {
  const navigate = useNavigate()
  const [organizationName, setOrganizationName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedModules, setSelectedModules] = useState(defaultModules)
  const [customModuleName, setCustomModuleName] = useState('')
  const [submodules, setSubmodules] = useState({
    lend: [],
    borrow: [],
    savings: [],
    investments: [],
    custom: [],
  })
  const [submoduleDrafts, setSubmoduleDrafts] = useState({
    lend: '',
    borrow: '',
    savings: '',
    investments: '',
    custom: '',
  })
  const [customSubmoduleDraft, setCustomSubmoduleDraft] = useState('')
  const [error, setError] = useState('')

  const moduleItems = useMemo(() => allModules, [])

  const toggleModule = (module) => {
    setSelectedModules((current) => {
      if (current.includes(module)) {
        return current.filter((item) => item !== module)
      }
      return [...current, module]
    })
  }

  const addSubmodule = (module) => {
    const draft = (module === 'custom' ? customSubmoduleDraft : submoduleDrafts[module])?.trim()

    if (!draft) {
      return
    }

    setSubmodules((current) => ({
      ...current,
      [module]: current[module].includes(draft) ? current[module] : [...current[module], draft],
    }))

    if (module === 'custom') {
      setCustomSubmoduleDraft('')
      return
    }

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
      setError('Organization Name is required')
      return
    }

    const missingSubmoduleModules = selectedModules.filter((module) => submodules[module].length === 0)

    if (missingSubmoduleModules.length > 0) {
      const readableModules = missingSubmoduleModules.map((module) => (module === 'custom' ? 'custom module' : module)).join(', ')
      setError(`Add at least one submodule under: ${readableModules}`)
      return
    }

    if (selectedModules.includes('custom') && !customModuleName.trim()) {
      setError('Custom module name is required')
      return
    }

    const activeModules = selectedModules
      .filter((module) => module !== 'custom')
      .map((module) => ({
        name: module,
        submodules: submodules[module],
      }))

    if (selectedModules.includes('custom')) {
      activeModules.push({
        name: customModuleName.trim(),
        submodules: submodules.custom,
      })
    }

    if (activeModules.length === 0) {
      setError('Please select at least one module')
      return
    }

    const selectedCurrency = JSON.parse(localStorage.getItem('selectedCurrency') || 'null')
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')

    const organizationPayload = {
      organizationName: organizationName.trim(),
      description: description.trim(),
      currency: selectedCurrency,
      modules: activeModules,
      submodules,
      ownerId: currentUser?.id || currentUser?._id || currentUser?.email || '',
    }

    let savedOrganization = null

    try {
      const response = await apiRequest('/organizations', {
        method: 'POST',
        body: JSON.stringify(organizationPayload),
      })

      savedOrganization = response?.data || null
    } catch (requestError) {
      setError(requestError.message || 'Unable to save organization')
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
        className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center"
      >
        <div className="w-full rounded-[2rem] border border-white/80 bg-[var(--card)] p-6 shadow-glass sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-primary-600">Setup Step 2 of 2</p>
            <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">Create Organization</h1>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">Set up your organization and choose the modules you want to use.</p>
          </div>

          <form onSubmit={handleCreateOrganization} className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">Organization Name *</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-light text-slate-700">Select Modules *</label>
              <div className="grid gap-4 md:grid-cols-2">
                {moduleItems.map((module) => {
                  const isSelected = selectedModules.includes(module)
                  const isCustom = module === 'custom'
                  const draftValue = isCustom ? customSubmoduleDraft : submoduleDrafts[module]
                  const moduleSubmodules = submodules[module]

                  return (
                    <div
                      key={module}
                      className={`rounded-2xl border p-4 transition ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-white/6 bg-[var(--card)]'}`}
                    >
                      <label className="flex cursor-pointer items-center justify-between gap-4">
                        <div>
                          {isCustom ? (
                            <div className="inline-flex max-w-[240px] rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/70 px-2 py-1.5 transition focus-within:border-primary-500 focus-within:bg-[var(--card)]">
                              <input
                                type="text"
                                value={customModuleName}
                                onChange={(e) => setCustomModuleName(e.target.value)}
                                className="w-full bg-transparent px-1 text-base font-light text-[var(--text)] outline-none placeholder:text-slate-400"
                                placeholder="Custom module"
                              />
                            </div>
                          ) : (
                            <p className="text-base font-light capitalize text-[var(--text)]">{module}</p>
                          )}
                          <p className="text-sm text-[var(--muted)]">{isCustom ? 'Add your own module name' : `Default module for ${module}`}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModule(module)}
                          className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                      </label>

                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-slate-500">Submodules</label>
                        {isCustom ? (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-slate-500">Add submodule</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={draftValue}
                                  onChange={(e) => setCustomSubmoduleDraft(e.target.value)}
                                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                  placeholder="Add submodule for custom module"
                                />
                                <button
                                  type="button"
                                  onClick={() => addSubmodule(module)}
                                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-3 text-primary-600 transition hover:bg-primary-100"
                                  aria-label={`Add submodule to ${module}`}
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={draftValue}
                              onChange={(e) => {
                                setSubmoduleDrafts((current) => ({ ...current, [module]: e.target.value }))
                              }}
                              className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                              placeholder={`Add submodule for ${module}`}
                            />
                            <button
                              type="button"
                              onClick={() => addSubmodule(module)}
                              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-3 text-primary-600 transition hover:bg-primary-100"
                              aria-label={`Add submodule to ${module}`}
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {moduleSubmodules.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {moduleSubmodules.map((item) => (
                              <span key={item} className="inline-flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-light text-slate-700 shadow-sm ring-1 ring-slate-200">
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeSubmodule(module, item)}
                                  className="text-slate-400 transition hover:text-red-500"
                                  aria-label={`Remove ${item} from ${module}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
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
                Create Organization
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
