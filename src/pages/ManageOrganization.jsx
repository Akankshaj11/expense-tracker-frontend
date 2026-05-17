import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

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

function createModuleItem(module, index) {
  return {
    id: `${module.name}-${index}-${Date.now()}`,
    name: module.name || '',
    submodules: Array.isArray(module.submodules) ? module.submodules : [],
  }
}

function createEmptyModule() {
  return {
    id: `module-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: '',
    submodules: [''],
  }
}

export default function ManageOrganization() {
  const navigate = useNavigate()
  const organizations = useMemo(() => loadOrganizations(), [])
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null

  const [organizationName, setOrganizationName] = useState(activeOrganization?.organizationName || '')
  const [description, setDescription] = useState(activeOrganization?.description || '')
  const [modules, setModules] = useState(() => (activeOrganization?.modules || []).map(createModuleItem))
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  if (!activeOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">No organization found</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Create an organization first</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">You need at least one organization before managing modules.</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25">
            Create Organization
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  const updateModule = (moduleId, key, value) => {
    setModules((current) => current.map((module) => (module.id === moduleId ? { ...module, [key]: value } : module)))
  }

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

  const addModule = () => {
    setModules((current) => [...current, createEmptyModule()])
  }

  const removeModule = (moduleId) => {
    setModules((current) => current.filter((module) => module.id !== moduleId))
  }

  const addSubmodule = (moduleId) => {
    setModules((current) =>
      current.map((module) =>
        module.id === moduleId ? { ...module, submodules: [...module.submodules, ''] } : module,
      ),
    )
  }

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

  const handleSave = (event) => {
    event.preventDefault()

    const normalizedModules = modules
      .map((module) => ({
        name: module.name.trim(),
        submodules: module.submodules.map((submodule) => submodule.trim()).filter(Boolean),
      }))
      .filter((module) => module.name)

    if (!organizationName.trim()) {
      setError('Organization name is required')
      return
    }

    if (normalizedModules.length === 0) {
      setError('Add at least one module')
      return
    }

    if (normalizedModules.some((module) => module.submodules.length === 0)) {
      setError('Each module needs at least one submodule')
      return
    }

    const updatedOrganization = {
      ...activeOrganization,
      organizationName: organizationName.trim(),
      description: description.trim(),
      modules: normalizedModules,
    }

    const updatedOrganizations = organizations.map((organization) =>
      organization.id === activeOrganization.id ? updatedOrganization : organization,
    )

    localStorage.setItem('organizations', JSON.stringify(updatedOrganizations))
    localStorage.setItem('organization', JSON.stringify(updatedOrganization))
    localStorage.setItem('activeOrgId', updatedOrganization.id)

    setError('')
    setSavedMessage('Organization updated successfully')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {activeOrganization.organizationName}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-blue-600">Manage Organization</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{activeOrganization.organizationName}</h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600">Update the organization details, edit module names, rename submodules, delete anything you no longer need, or add new items.</p>
          </div>

          <form onSubmit={handleSave} className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Organization Name *</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Modules & Submodules</h2>
                <p className="text-sm text-slate-500">Edit every module directly.</p>
              </div>
              <button
                type="button"
                onClick={addModule}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Add Module
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <li key={module.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module {moduleIndex + 1}</label>
                      <input
                        type="text"
                        value={module.name}
                        onChange={(event) => updateModule(module.id, 'name', event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Module name"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeModule(module.id)}
                      className="mt-7 inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      aria-label={`Delete module ${module.name || moduleIndex + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 pl-2">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Submodules</p>
                      <button
                        type="button"
                        onClick={() => addSubmodule(module.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add Submodule
                      </button>
                    </div>

                    <ul className="space-y-3 border-l border-dashed border-slate-300 pl-4">
                      {module.submodules.map((submodule, subIndex) => (
                        <li key={`${module.id}-${subIndex}`} className="flex items-center gap-2">
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                          <input
                            type="text"
                            value={submodule}
                            onChange={(event) => updateSubmodule(module.id, subIndex, event.target.value)}
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder={`Submodule ${subIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeSubmodule(module.id, subIndex)}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Remove submodule"
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

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            {savedMessage ? <p className="text-sm font-medium text-emerald-600">{savedMessage}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5">
                Save Changes
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}