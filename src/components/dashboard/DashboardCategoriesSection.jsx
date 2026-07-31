// Repo file header
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EllipsisVerticalIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { apiRequest } from '../../utils/api'
import { loadOrganizationsFromBackend } from '../../utils/organizationSync'
import { readJSON } from '../../utils/transactionHelpers'
import DashboardCategoryEditor from './DashboardCategoryEditor'

// Function: getCategoryTypeBadge
function getCategoryTypeBadge(category) {
  if (!(category?.transactionType || category?.direction)) {
    return null
  }

  const transactionType = String(category.transactionType || category.direction || '').toLowerCase()

  if (['revenue', 'in', 'income', 'credit'].includes(transactionType)) {
    return {
      label: 'I',
      className: 'bg-emerald-500 text-white',
      ariaLabel: 'In category',
      title: 'In category',
    }
  }

  if (['expenses', 'out', 'expense', 'debit', 'investments', 'investment'].includes(transactionType)) {
    return {
      label: 'O',
      className: 'bg-rose-500 text-white',
      ariaLabel: 'Out category',
      title: 'Out category',
    }
  }

  return null
}

export default function DashboardCategoriesection({ text, categoryCards, onCategoryClick, activeOrganization, organizations, setOrganizations }) {
  const navigate = useNavigate()
  const [openMenuId, setOpenMenuId] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingOriginalName, setEditingOriginalName] = useState('')
  const [categoryNameDraft, setCategoryNameDraft] = useState('')
  const [subcategoryDrafts, setsubcategoryDrafts] = useState([])
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
  const handleView = (categoryLabel) => {
    const resolvedCategoryName = String(categoryLabel || '').trim()
    if (!resolvedCategoryName) {
      return
    }

    navigate(`/category/${encodeURIComponent(resolvedCategoryName)}`)

    setOpenMenuId(null)
  }

  // Function: openEditor
  const openEditor = (category) => {
    try {
      console.debug('DashboardCategoriesection.openEditor', category?.rawName || category?.label)
    } catch (e) { }
    setEditingOriginalName(category.rawName || '')
    setCategoryNameDraft(category.label || category.rawName || '')
    setsubcategoryDrafts(Array.isArray(category.subcategories) ? [...category.subcategories] : [])
    setError('')
    setIsEditorOpen(true)
    setOpenMenuId(null)
  }

  // Function: closeEditor
  const closeEditor = () => {
    setIsEditorOpen(false)
    setEditingOriginalName('')
    setCategoryNameDraft('')
    setsubcategoryDrafts([])
    setError('')
    setIsSaving(false)
  }

  // Function: updatesubcategoryDraft
  const updatesubcategoryDraft = (index, value) => {
    setsubcategoryDrafts((current) => current.map((subcategory, subIndex) => (subIndex === index ? value : subcategory)))
  }

  // Function: addsubcategoryDraft
  const addsubcategoryDraft = () => {
    setsubcategoryDrafts((current) => [...current, ''])
  }

  // Function: removesubcategoryDraft
  const removesubcategoryDraft = (index) => {
    setsubcategoryDrafts((current) => current.filter((_, subIndex) => subIndex !== index))
  }

  // Function: persistUpdatedOrganizations
  const persistUpdatedOrganizations = async (nextOrganizations) => {
    const activeOrgId = String(activeOrganization?.id || '')
    const activeOrg = nextOrganizations.find((org) => String(org.id) === activeOrgId)
    if (!activeOrg) {
      return
    }

    // Function: categoriesForBackend
    const categoriesForBackend = (activeOrg.categories || []).map((category) => ({
      name: category.name,
      transactionType: category.transactionType || 'in',
      isCustom: category?.isCustom === true,
      subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
    }))
    const subcategoriesMap = {}
    categoriesForBackend.forEach((category) => {
      subcategoriesMap[category.name] = Array.isArray(category.subcategories) ? category.subcategories : []
    })

    await apiRequest(`/organizations/${encodeURIComponent(activeOrg.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ categories: categoriesForBackend, subcategories: subcategoriesMap }),
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

    const nextName = categoryNameDraft.trim()
    const nextsubcategories = subcategoryDrafts.map((subcategory) => subcategory.trim()).filter(Boolean)

    if (!nextName) {
      setError(text.categoryNameRequired)
      return
    }

    if (nextsubcategories.length === 0) {
      setError(text.addAtLeastOnesubcategory)
      return
    }

    const activeCategories = Array.isArray(activeOrganization.categories) ? [...activeOrganization.categories] : []
    const originalName = String(editingOriginalName || '').trim()
    const duplicateExists = activeCategories.some((category) => {
      const normalized = String(category.name || '').trim().toLowerCase()
      return normalized === nextName.toLowerCase() && normalized !== originalName.toLowerCase()
    })

    if (duplicateExists) {
      setError(text.categoryNameAlreadyExists || 'Category name already exists')
      return
    }

    const nextCategories = activeCategories.map((category) => {
      if (String(category.name || '') !== originalName) {
        return category
      }

      return {
        ...category,
        name: nextName,
        transactionType: category.transactionType || 'in',
        subcategories: nextsubcategories,
      }
    })

    // Function: nextOrganizations
    const nextOrganizations = (readJSON('organizations', []) || []).map((organization) => {
      if (organization.id !== activeOrganization.id) {
        return organization
      }

      const nextsubcategoryMap = {}
      nextCategories.forEach((category) => {
        nextsubcategoryMap[category.name] = Array.isArray(category.subcategories) ? category.subcategories : []
      })

      return {
        ...organization,
        categories: nextCategories,
        subcategories: nextsubcategoryMap,
      }
    })

    try {
      setIsSaving(true)
      await persistUpdatedOrganizations(nextOrganizations)

      const transactions = readJSON('transactions', [])
      const categoryRenameMap = new Map()
      categoryRenameMap.set(originalName, nextName)
      const subcategoryRenameMap = new Map()
      categoryCards
        .find((item) => item.rawName === originalName)
        ?.rawsubcategories?.forEach((oldsubcategory, index) => {
          const newsubcategory = nextsubcategories[index]
          if (newsubcategory && newsubcategory !== oldsubcategory) {
            subcategoryRenameMap.set(oldsubcategory, newsubcategory)
          }
        })

      const updatedTransactions = transactions.map((transaction) => {
        if (transaction.organizationId && transaction.organizationId !== activeOrganization.id) {
          return transaction
        }

        if (String(transaction.category || '') !== originalName) {
          return transaction
        }

        const nextTransaction = { ...transaction, category: nextName }
        const mappedsubcategory = subcategoryRenameMap.get(transaction.subcategory)
        if (mappedsubcategory) {
          nextTransaction.subcategory = mappedsubcategory
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
  const handleDelete = async (category, event) => {
    event?.stopPropagation()

    try {
      console.debug('DashboardCategoriesection.handleDelete', category?.rawName || category?.label)
    } catch (e) { }

    const categoryName = String(category.rawName || category.label || '').trim()
    if (!categoryName || !activeOrganization?.id) {
      setOpenMenuId(null)
      return
    }

    const categoryLabel = category.label || categoryName
    const confirmed = window.confirm(`Delete category "${categoryLabel}"? This cannot be undone.`)
    if (!confirmed) {
      setOpenMenuId(null)
      return
    }

    const activeOrgId = String(activeOrganization.id)
    const sourceOrganizations = Array.isArray(organizations) && organizations.length > 0 ? organizations : readJSON('organizations', [])
    const currentOrg = sourceOrganizations.find((org) => String(org.id) === activeOrgId)
    const activeCategories = Array.isArray(currentOrg?.categories) ? currentOrg.categories : []

    if (activeCategories.length <= 1) {
      alert(text.addAtLeastOneCategory || 'At least one category is required')
      setOpenMenuId(null)
      return
    }

    const normalizedCategoryName = categoryName.toLowerCase()
    const nextCategories = activeCategories.filter(
      (item) => String(item.name || '').trim().toLowerCase() !== normalizedCategoryName,
    )

    if (nextCategories.length === activeCategories.length) {
      alert(text.unableToSaveOrganization || 'Unable to delete this category')
      setOpenMenuId(null)
      return
    }

    const nextsubcategoriesMap = {}
    nextCategories.forEach((item) => {
      nextsubcategoriesMap[item.name] = Array.isArray(item.subcategories) ? item.subcategories : []
    })

    const nextOrganizations = sourceOrganizations.map((organization) => {
      if (String(organization.id) !== activeOrgId) {
        return organization
      }

      return {
        ...organization,
        categories: nextCategories,
        subcategories: nextsubcategoriesMap,
      }
    })

    try {
      await persistUpdatedOrganizations(nextOrganizations)

      const transactions = readJSON('transactions', [])
      const nextTransactions = transactions.filter((transaction) => {
        if (transaction.organizationId && String(transaction.organizationId) !== activeOrgId) {
          return true
        }

        return String(transaction.category || '').trim().toLowerCase() !== normalizedCategoryName
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
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.categories}</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.categoriesYouAdded}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
          <Squares2X2Icon className="h-4 w-4" />
          {categoryCards.length} {text.categories.toLowerCase()}
        </div>
      </div>

      <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categoryCards.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: index * 0.05, duration: 0.45 }}
            // onClick={(e) => {
            //   if (openMenuId === category.id) {
            //     // if menu for this category is open, ignore article clicks
            //     return
            //   }
            //   navigate(`/category/${encodeURIComponent(category.rawName || category.label || '')}`)
            // }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (openMenuId === category.id) return
                navigate(`/category/${encodeURIComponent(category.rawName || category.label || '')}`)
              }
            }}
            className="relative flex h-full cursor-pointer flex-col rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {(() => {
              const typeBadge = getCategoryTypeBadge(category)

              return (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl p-3" style={{ backgroundColor: category.theme.iconBg, color: category.theme.fg }}>
                      <category.theme.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-light capitalize text-[var(--text)]">{category.label}</p>
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
                      <p className="text-sm text-slate-500">{category.subcategories.length} {text.subcategories.toLowerCase()}</p>
                    </div>
                  </div>
                  <div
                    ref={(node) => {
                      if (node) {
                        menuRefs.current.set(category.id, node)
                      } else {
                        menuRefs.current.delete(category.id)
                      }
                    }}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setOpenMenuId(openMenuId === category.id ? null : category.id)
                      }}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-[var(--card)] hover:text-[var(--muted)]"
                      aria-label="Category actions"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>

                    {openMenuId === category.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-white/6 bg-[var(--card)] py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            handleView(category.rawName)
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
                            openEditor(category)
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleDelete(category, event)}
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
                navigate(`/category/${encodeURIComponent(category.rawName || category.label || '')}`)
              }
              className="mt-5 cursor-pointer"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-light uppercase tracking-[0.2em] text-slate-500">{text.amount}</p>
                  <p className={`mt-2 inline-flex items-center gap-1 text-2xl font-light tracking-tight ${category.amountValue < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                    <span>{category.amountValue < 0 ? '-' : category.amountValue > 0 ? '+' : ''}</span>
                    <span>{category.amount}</span>
                  </p>
                </div>
                <div className="text-right text-xs font-light text-slate-500">{text.allocated}</div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-[var(--card)]">
                <div className="h-full rounded-full" style={{ width: `${category.fill}%`, backgroundColor: category.theme.fg }} />
              </div>


            </div>

            {category.recentTransaction ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-light text-[var(--text)]">{category.recentTransaction.subcategory}</span>
                  <span className={category.recentTransaction.amountValue < 0 ? 'shrink-0 font-light text-rose-600' : 'shrink-0 font-light text-emerald-600'}>
                    {category.recentTransaction.amount}
                  </span>
                </div>
              </div>
            ) : null}

          </motion.div>
        ))}
      </div>

      <DashboardCategoryEditor
        text={text}
        isOpen={isEditorOpen}
        onClose={closeEditor}
        categoryNameDraft={categoryNameDraft}
        setCategoryNameDraft={setCategoryNameDraft}
        subcategoryDrafts={subcategoryDrafts}
        addsubcategoryDraft={addsubcategoryDraft}
        updatesubcategoryDraft={updatesubcategoryDraft}
        removesubcategoryDraft={removesubcategoryDraft}
        isSaving={isSaving}
        error={error}
        onSave={handleSave}
      />
    </section>
  )
}