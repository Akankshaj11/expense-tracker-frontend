// Repo file header
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiRequest } from '../../utils/api'
import { loadOrganizationsFromBackend, readCachedOrganizations } from '../../utils/organizationSync'
import useLanguage from '../../hooks/useLanguage'

import { translateText } from '../../i18n/translations'

function getBooksFromOrgDesc(org) {
  try {
    const rawDesc = org?.description || ''
    if (rawDesc.includes('|||')) {
      const booksJSON = rawDesc.split('|||')[1].trim()
      return JSON.parse(booksJSON)
    }
  } catch (e) {
    console.error('Failed to parse books from organization description:', e)
  }
  return []
}

export default function ManageOrganization() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => readCachedOrganizations())
  const { language, text } = useLanguage()
  
  const activeOrgId = localStorage.getItem('activeOrgId') || organizations[0]?.id || ''
  const activeOrganization = organizations.find((item) => item.id === activeOrgId) || organizations[0] || null

  const [organizationName, setOrganizationName] = useState('')
  const [description, setDescription] = useState('')
  const [books, setBooks] = useState([])
  const [newBookName, setNewBookName] = useState('')
  
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reload organizations from backend on mount to ensure fresh data
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

  // Sync state with activeOrganization
  useEffect(() => {
    if (!activeOrganization) return
    setOrganizationName(activeOrganization.organizationName || '')
    setDescription(activeOrganization.description ? activeOrganization.description.split('|||')[0].trim() : '')
    setBooks(getBooksFromOrgDesc(activeOrganization))
    setError('')
    setSavedMessage('')
  }, [activeOrganization])

  if (!activeOrganization) {
    return (
      <div className="theme-light-violet flex min-h-screen items-center justify-center px-4 bg-slate-50/50">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.noOrganizationFound}</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)]">{text.createAnOrganizationFirst}</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.needOrganizationBeforeManagingCategories}</p>
          <Link to="/create-organization" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25">
            {text.createOrganization}
            <PlusIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  const handleAddBook = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const name = newBookName.trim()
    if (!name) {
      setError('Book name is required')
      return
    }
    if (books.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      setError('A book with this name already exists')
      return
    }
    setBooks([...books, { name, createdAt: new Date().toISOString() }])
    setNewBookName('')
    setError('')
  }

  const handleDeleteBook = (index) => {
    if (books.length <= 1) {
      setError('At least one book is required')
      return
    }
    setBooks(books.filter((_, i) => i !== index))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setSavedMessage('')

    if (!organizationName.trim()) {
      setError(text.organizationNameRequired || 'Organization name is required')
      return
    }

    if (books.length === 0) {
      setError('At least one book is required')
      return
    }

    const serializedBooks = JSON.stringify(books.map((b) => ({
      name: b.name,
      description: b.description || "",
      categories: b.categories || activeOrganization.categories || [],
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString(),
    })))
    const finalDesc = description.trim() + " ||| " + serializedBooks

    const updatePayload = {
      organizationName: organizationName.trim(),
      description: finalDesc,
      categories: activeOrganization.categories || [],
      subcategories: activeOrganization.subcategories || {},
    }

    const isMongoId = /^[a-f0-9]{24}$/.test(activeOrganization.id)

    try {
      let updatedOrg = null

      if (isMongoId) {
        const response = await apiRequest(`/organizations/${activeOrganization.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        })
        updatedOrg = response?.data || null
      } else {
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
                categories: updatedOrg.categories,
                subcategories: updatedOrg.subcategories,
              }
            : org
        )

        localStorage.setItem('organizations', JSON.stringify(updatedOrganizations))
        localStorage.setItem('organization', JSON.stringify(updatedOrg))
        localStorage.setItem('activeOrgId', updatedOrg.id)

        // Reset active book if deleted
        const activeBookKey = `activeBookName_${updatedOrg.id}`
        const currentActiveBookName = localStorage.getItem(activeBookKey)
        if (!books.some((b) => b.name === currentActiveBookName)) {
          localStorage.setItem(activeBookKey, books[0].name)
        }

        setError('')
        setSavedMessage(text.organizationUpdatedSuccessfully || 'Organization updated successfully')
        setTimeout(() => {
          navigate('/dashboard')
        }, 800)
      }
    } catch (err) {
      setError(err?.message || text.unableToSaveOrganization || 'Unable to save organization changes')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const isMongoId = /^[a-f0-9]{24}$/.test(activeOrganization.id)

    try {
      if (isMongoId) {
        await apiRequest(`/organizations/${activeOrganization.id}`, {
          method: 'DELETE',
        })
      }

      const updatedOrganizations = organizations.filter((org) => org.id !== activeOrganization.id)
      localStorage.setItem('organizations', JSON.stringify(updatedOrganizations))

      if (localStorage.getItem('activeOrgId') === activeOrganization.id) {
        localStorage.removeItem('organization')
        localStorage.removeItem('activeOrgId')
      }

      setError('')
      setSavedMessage(text.organizationDeletedSuccessfully || 'Organization deleted successfully')
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
      const errorMsg = err?.message || text.unableToDeleteOrganization || 'Failed to delete organization'
      setError(errorMsg)
      setDeleteConfirmOpen(false)
    }
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
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {text.backToDashboard || 'Back to Dashboard'}
            </Link>
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-primary-600">{text.manageOrganization || 'Manage Organization'}</p>
            <h1 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">{activeOrganization.organizationName}</h1>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">{text.manageOrganizationDescription || 'Edit organization profile details and manage books'}</p>
          </div>

          <form onSubmit={handleSave} className="mt-8 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">{text.organizationNameLabel || 'Organization Name'}</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                  placeholder={text.organizationNamePlaceholder}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-light text-slate-700">{text.descriptionLabel || 'Description'}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                  placeholder={text.descriptionPlaceholder}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Books <span className="text-xs font-light text-rose-500">(At least 1 required)</span>
                </label>
              </div>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddBook(e)
                    }
                  }}
                  placeholder="Enter book name (e.g. Personal, Business)"
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-4 py-2.5 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                />
                <button
                  type="button"
                  onClick={handleAddBook}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-primary-700 transition shrink-0"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Book
                </button>
              </div>

              {books.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-slate-400 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="text-sm font-light text-slate-500">No books added yet</span>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {books.map((book, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl border border-white/6 bg-[var(--card)] p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">{book.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(index)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        aria-label="Delete book"
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {savedMessage ? <p className="text-sm text-emerald-600">{savedMessage}</p> : null}

            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-light text-rose-600 transition hover:bg-rose-100"
              >
                <TrashIcon className="h-4 w-4" />
                {text.deleteOrganization || 'Delete Organization'}
              </button>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5">
                {text.saveChanges || 'Save Changes'}
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 py-6 backdrop-blur-sm z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="inner-card-accent w-full max-w-md rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-lg sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-light text-[var(--text)]">{text.deleteOrganization || 'Delete Organization'}</h2>
              <p className="mt-2 text-base leading-7 text-[var(--muted)]">
                Are you sure you want to delete organization "{activeOrganization.organizationName}"? This action cannot be undone and will delete all associated data.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-full border border-white/6 bg-[var(--card)] px-6 py-3 text-sm font-light text-[var(--text)] transition hover:border-white/10 disabled:opacity-50"
              >
                {text.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-light text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                {isDeleting ? (text.deleting || 'Deleting...') : (text.delete || 'Delete')}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  )
}