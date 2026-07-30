import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EllipsisVerticalIcon, BookOpenIcon, PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { getBooksFromOrganization, addNewBook, renameBook, deleteBook } from '../../utils/bookUtils'
import { loadOrganizationsFromBackend, loadTransactionsFromBackend } from '../../utils/organizationSync'
import useLanguage from '../../hooks/useLanguage'
import { formatMoney } from '../../utils/transactionHelpers'

function getRelativeTime(dateString, text = {}) {
  if (!dateString) return text.createdJustNow || 'created just now'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return text.createdJustNow || 'created just now'
  
  const difference = Date.now() - date.getTime()
  const seconds = Math.floor(difference / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return text.createdJustNow || 'created just now'
  } else if (minutes < 60) {
    const template = text.createdMinutesAgo || 'created {m} minutes ago'
    return template.replace('{m}', minutes)
  } else if (hours < 24) {
    const template = text.createdHoursAgo || 'created {h} hours ago'
    return template.replace('{h}', hours)
  } else {
    const template = text.createdDaysAgo || 'created {d} days ago'
    return template.replace('{d}', days)
  }
}

export default function AllBooks() {
  const navigate = useNavigate()
  const { language, text } = useLanguage()
  const [organizations, setOrganizations] = useState([])
  const [activeOrgId, setActiveOrgId] = useState('')
  const [transactions, setTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  
  // Dialog/Modal states
  const [openMenuName, setOpenMenuName] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [newBookName, setNewBookName] = useState('')
  const [renameTargetName, setRenameTargetName] = useState('')
  const [renameNewName, setRenameNewName] = useState('')
  
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const menuRefs = useRef(new Map())

  // Initial load
  useEffect(() => {
    const storedOrgs = JSON.parse(localStorage.getItem('organizations') || '[]')
    setOrganizations(storedOrgs)
    const activeId = localStorage.getItem('activeOrgId') || storedOrgs[0]?.id || ''
    setActiveOrgId(activeId)

    const storedTx = JSON.parse(localStorage.getItem('transactions') || '[]')
    setTransactions(storedTx)
  }, [])

  // Sync with backend on activeOrgId load/change
  useEffect(() => {
    if (!activeOrgId) return

    let cancelled = false
    loadTransactionsFromBackend(activeOrgId).then(() => {
      if (!cancelled) {
        const storedTx = JSON.parse(localStorage.getItem('transactions') || '[]')
        setTransactions(storedTx)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeOrgId])

  // Sync organizations with backend
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

  // Listen for transactions:updated event to reload state from localStorage
  useEffect(() => {
    const handleTransactionsUpdated = () => {
      const storedTx = JSON.parse(localStorage.getItem('transactions') || '[]')
      setTransactions(storedTx)
    }
    window.addEventListener('transactions:updated', handleTransactionsUpdated)
    return () => {
      window.removeEventListener('transactions:updated', handleTransactionsUpdated)
    }
  }, [])

  const activeOrganization = useMemo(() => {
    return organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  }, [organizations, activeOrgId])

  const books = useMemo(() => {
    return activeOrganization ? getBooksFromOrganization(activeOrganization) : []
  }, [activeOrganization])

  const filteredBooks = useMemo(() => {
    const list = books.filter((book) =>
      book.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    }
    return list
  }, [books, searchTerm, sortBy])

  const selectedCurrency = activeOrganization?.currency || { code: 'USD', symbol: '$' }
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'mr-IN'

  const bookBalances = useMemo(() => {
    const balances = {}
    books.forEach((b) => {
      balances[b.name] = 0
    })
    const activeTransactions = transactions.filter((t) => {
      if (t.organizationId && String(t.organizationId) !== String(activeOrgId)) {
        return false
      }
      return true
    })
    activeTransactions.forEach((t) => {
      const bookName = t.book || 'Default Book'
      const amount = Number(t.amount || 0)
      const direction = t.direction || 'in'
      if (direction === 'in') {
        balances[bookName] = (balances[bookName] || 0) + amount
      } else {
        balances[bookName] = (balances[bookName] || 0) - amount
      }
    })
    return balances
  }, [books, transactions, activeOrgId])

  // Handle click outside to close actions menu
  useEffect(() => {
    if (!openMenuName) return undefined

    const handlePointerDown = (event) => {
      const activeMenu = menuRefs.current.get(openMenuName)
      if (activeMenu && !activeMenu.contains(event.target)) {
        setOpenMenuName(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [openMenuName])

  const handleBookClick = (bookName) => {
    if (!activeOrganization) return
    localStorage.setItem(`activeBookName_${activeOrganization.id}`, bookName)
    navigate(`/book-transactions/${encodeURIComponent(bookName)}`)
  }

  // Book action: Add
  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!newBookName.trim()) {
      setError('Book name is required')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await addNewBook(
        activeOrganization.id,
        newBookName.trim(),
        'Custom book',
        organizations,
        setOrganizations
      )
      setIsAddOpen(false)
      setNewBookName('')
    } catch (err) {
      setError(err?.message || 'Failed to add book')
    } finally {
      setIsSaving(false)
    }
  }

  // Book action: Rename
  const handleRenameSubmit = async (e) => {
    e.preventDefault()
    if (!renameNewName.trim()) {
      setError('Book name is required')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await renameBook(
        activeOrganization.id,
        renameTargetName,
        renameNewName.trim(),
        organizations,
        setOrganizations
      )
      setIsRenameOpen(false)
      setRenameTargetName('')
      setRenameNewName('')
    } catch (err) {
      setError(err?.message || 'Failed to rename book')
    } finally {
      setIsSaving(false)
    }
  }

  // Book action: Delete
  const handleDeleteClick = async (bookName) => {
    if (books.length <= 1) {
      alert('You must have at least one book in this organization')
      return
    }
    if (!window.confirm(`Are you sure you want to delete book "${bookName}"? All transactions inside this book will also be deleted.`)) {
      return
    }
    try {
      await deleteBook(
        activeOrganization.id,
        bookName,
        organizations,
        setOrganizations
      )
      setOpenMenuName(null)
    } catch (err) {
      alert(err?.message || 'Failed to delete book')
    }
  }

  return (
    <div className="theme-light-violet h-full min-h-screen px-4 py-4 pb-16 text-[var(--text)] sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="mx-auto max-w-5xl pt-4">
        {/* Navigation Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left side: Back Arrow and Heading */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none"
              aria-label="Back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{text.allBooks}</h1>
          </div>

          {/* Right side: Search bar, Sort dropdown & Add Book Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search input field */}
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={text.searchBooks}
                className="w-full rounded-full border border-slate-200 bg-white pl-4 pr-10 py-2 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            {/* Sort Select Filter */}
            <div className="relative w-full sm:w-36">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition cursor-pointer appearance-none pr-8"
              >
                <option value="newest">{text.newestFirst}</option>
                <option value="oldest">{text.oldestFirst}</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            <button
              onClick={() => {
                setError('')
                setIsAddOpen(true)
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4" />
              {text.addBook}
            </button>
          </div>
        </div>

        {/* Books Cards Grid */}
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => {
            const balance = bookBalances[book.name] || 0
            const formattedBalance = formatMoney(Math.abs(balance), selectedCurrency, locale)
            const isMenuOpen = openMenuName === book.name

            return (
              <motion.div
                key={book.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative flex flex-col justify-between rounded-3xl border border-white/6 bg-[var(--card)] p-5 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => handleBookClick(book.name)}
              >
                {/* Top part */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
                      <BookOpenIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{book.name}</h3>
                      <p className="mt-1 text-xs text-slate-400 font-light">
                        {getRelativeTime(book.createdAt, text)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                    ref={(el) => {
                      if (el) {
                        menuRefs.current.set(book.name, el)
                      } else {
                        menuRefs.current.delete(book.name)
                      }
                    }}
                  >
                    <button
                      onClick={() => setOpenMenuName(isMenuOpen ? null : book.name)}
                      className="rounded-full p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
                      aria-label="Book actions"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>

                    <AnimatePresence>
                      {isMenuOpen && (
                        <div className="absolute right-0 top-10 z-10 w-36 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
                          <button
                            onClick={() => {
                              setRenameTargetName(book.name)
                              setRenameNewName(book.name)
                              setError('')
                              setIsRenameOpen(true)
                              setOpenMenuName(null)
                            }}
                            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
                          >
                            {text.rename}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(book.name)}
                            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition"
                          >
                            {text.delete}
                          </button>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bottom part: Balance Display */}
                <div className="mt-6 border-t border-slate-50 pt-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-light uppercase tracking-wider text-slate-400">{text.netBalance}</p>
                      <p className={`mt-1 text-lg font-bold tracking-tight ${balance >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
                        {balance < 0 ? '-' : ''}
                        {formattedBalance}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 underline hover:text-primary-600 transition">
                      {text.viewLedger} &rarr;
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add Book Modal (NO Description Input) */}
      <AnimatePresence>
        {isAddOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setIsAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-800">{text.addBook}</h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{text.bookName}</label>
                  <input
                    type="text"
                    required
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    placeholder="e.g. Personal Expenses"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition"
                  />
                </div>
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {text.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-2xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition"
                  >
                    {isSaving ? `${text.saving}...` : text.addBook}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rename Book Modal */}
      <AnimatePresence>
        {isRenameOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setIsRenameOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-800">{text.renameBook}</h3>
                <button
                  onClick={() => setIsRenameOpen(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleRenameSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{text.bookName}</label>
                  <input
                    type="text"
                    required
                    value={renameNewName}
                    onChange={(e) => setRenameNewName(e.target.value)}
                    placeholder="e.g. Household Ledger"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition"
                  />
                </div>
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRenameOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    {text.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-2xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition"
                  >
                    {isSaving ? `${text.saving}...` : text.renameBook}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
