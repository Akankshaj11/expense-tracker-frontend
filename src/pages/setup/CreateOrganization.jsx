// Repo file header
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api'
import { translateCategoryLabel, translateSubcategoryLabel, translateText } from '../../i18n/translations'
import useLanguage from '../../hooks/useLanguage'

const revenueCategories = ['Salary', 'Freelance', 'Bonus', 'Interest', 'Commission', 'Pocket Money']
const expenseCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Rent', 'Subscriptions', 'Loans', 'Taxes']
const investmentCategories = ['Mutual Funds', 'Stocks', 'Crypto', 'Fixed Deposits', 'Gold']

// Add a predefined "Investment Returns" category (treated as an "in" type)
const CATEGORY_LIST = ['Revenue', 'Expenses', 'Investments', 'Investment Returns', 'Lend', 'Borrow', 'custom']
const defaultSelectedCategories = ['Revenue', 'Expenses', 'Investments', 'Investment Returns', 'Lend', 'Borrow']

function createEmptyCategoriestate() {
  return Object.fromEntries(CATEGORY_LIST.map((category) => [category, []]))
}

function createEmptyDraftState() {
  return Object.fromEntries(CATEGORY_LIST.map((category) => [category, '']))
}

function createCustomCard() {
  return {
    id: `custom-card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    checked: false,
    name: '',
    transactionType: 'in',
    subcategoryDraft: '',
    subcategories: [],
  }
}

export default function CreateOrganization() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language, text } = useLanguage()
  const [organizationName, setOrganizationName] = useState('')
  const [description, setDescription] = useState('')
  const [books, setBooks] = useState([])
  const [newBookName, setNewBookName] = useState('')
  const [error, setError] = useState('')

  const backPath = location.state?.from || '/select-language'

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

  const handleCreateOrganization = async (e) => {
    e.preventDefault()
    setError('')

    if (!organizationName.trim()) {
      setError(text.organizationNameRequired || 'Organization name is required')
      return
    }

    if (books.length === 0) {
      setError('At least one book is required')
      return
    }

    const defaultCategoriesData = [
      { name: 'Revenue', direction: 'in', transactionType: 'in', categoryType: 'in', isCustom: false, subcategories: ['Salary', 'Freelance', 'Bonus', 'Interest', 'Commission', 'Pocket Money'] },
      { name: 'Expenses', direction: 'out', transactionType: 'out', categoryType: 'out', isCustom: false, subcategories: ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Rent', 'Subscriptions', 'Loans', 'Taxes'] },
      { name: 'Investments', direction: 'out', transactionType: 'out', categoryType: 'out', isCustom: false, subcategories: ['Mutual Funds', 'Stocks', 'Crypto', 'Fixed Deposit', 'Gold'] },
      { name: 'Investment Returns', direction: 'in', transactionType: 'in', categoryType: 'in', isCustom: false, subcategories: ['Mutual Funds', 'Stocks', 'Crypto', 'Fixed Deposit', 'Gold'] },
      { name: 'Lend', direction: 'out', transactionType: 'out', categoryType: 'out', isCustom: false, subcategories: ['Friends', 'Family', 'Colleagues'] },
      { name: 'Borrow', direction: 'in', transactionType: 'in', categoryType: 'in', isCustom: false, subcategories: ['Friends', 'Family', 'Colleagues'] },
    ]

    const subcategoriesData = {
      Revenue: ['Salary', 'Freelance', 'Bonus', 'Interest', 'Commission', 'Pocket Money'],
      Expenses: ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Rent', 'Subscriptions', 'Loans', 'Taxes'],
      Investments: ['Mutual Funds', 'Stocks', 'Crypto', 'Fixed Deposit', 'Gold'],
      'Investment Returns': ['Mutual Funds', 'Stocks', 'Crypto', 'Fixed Deposit', 'Gold'],
      Lend: ['Friends', 'Family', 'Colleagues'],
      Borrow: ['Friends', 'Family', 'Colleagues'],
    }

    const serializedBooks = JSON.stringify(books.map((b) => ({
      name: b.name,
      description: "",
      categories: defaultCategoriesData.map((m) => ({
        name: m.name,
        type: m.direction,
        subcategories: m.subcategories,
      })),
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString(),
    })))
    const finalDescription = description.trim() + " ||| " + serializedBooks

    const selectedCurrency = JSON.parse(localStorage.getItem('selectedCurrency') || 'null')

    const organizationPayload = {
      organizationName: organizationName.trim(),
      description: finalDescription,
      currency: selectedCurrency,
      categories: defaultCategoriesData,
      subcategories: subcategoriesData,
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
    localStorage.setItem(`activeBookName_${organization.id}`, books[0].name)
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
                        onClick={() => setBooks(books.filter((_, i) => i !== index))}
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

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                {text.createOrganizationButton || 'Create Organization'}
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
