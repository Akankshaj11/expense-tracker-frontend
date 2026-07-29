import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EllipsisVerticalIcon, BookOpenIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getBooksFromOrganization, addNewBook, renameBook, deleteBook } from '../../utils/bookUtils'

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

export default function DashboardBooksSection({
  text,
  activeOrganization,
  organizations,
  setOrganizations,
  bookBalances,
  selectedCurrency,
  locale
}) {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [openMenuName, setOpenMenuName] = useState(null)
  
  // Dialog/Modal states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [newBookName, setNewBookName] = useState('')
  const [newBookDesc, setNewBookDesc] = useState('')
  const [renameTargetName, setRenameTargetName] = useState('')
  const [renameNewName, setRenameNewName] = useState('')
  
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  const menuRefs = useRef(new Map())

  // Load books whenever activeOrganization changes (sorting newest first)
  useEffect(() => {
    if (activeOrganization) {
      const list = getBooksFromOrganization(activeOrganization)
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setBooks(list)
    } else {
      setBooks([])
    }
  }, [activeOrganization, organizations])

  // Listen for custom event to open Add Book modal
  useEffect(() => {
    const handleOpenAddBook = () => {
      setIsAddOpen(true)
      setNewBookName('')
      setNewBookDesc('')
      setError('')
    }
    window.addEventListener('dashboard:add-book', handleOpenAddBook)
    return () => {
      window.removeEventListener('dashboard:add-book', handleOpenAddBook)
    }
  }, [])

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
    localStorage.setItem(`activeBookName_${activeOrganization.id}`, bookName)
    navigate(`/book-transactions/${encodeURIComponent(bookName)}`)
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
  const handleDeleteClick = async (bookName, e) => {
    e.stopPropagation()
    setOpenMenuName(null)
    if (!window.confirm(`Are you sure you want to delete "${bookName}" and all its transactions? This cannot be undone.`)) {
      return
    }
    try {
      await deleteBook(activeOrganization.id, bookName, organizations, setOrganizations)
    } catch (err) {
      alert(err?.message || 'Failed to delete book')
    }
  }

  // Add Book: Submit
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
        newBookDesc.trim() || 'Custom book',
        organizations,
        setOrganizations
      )
      setIsAddOpen(false)
      setNewBookName('')
      setNewBookDesc('')
    } catch (err) {
      setError(err?.message || 'Failed to add book')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.yourBooks}</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.manageBookRecords}</h2>
        </div>
        <button
          onClick={() => navigate('/all-books')}
          className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          {text.seeAll}
        </button>
      </div>

      {/* Grid of Books */}
      <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {books.slice(0, 6).map((book, index) => {
          const balance = bookBalances[book.name] || 0
          const formattedBalance = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: selectedCurrency?.code || 'USD',
            maximumFractionDigits: 0,
          }).format(Math.abs(balance))

          return (
            <motion.div
              key={book.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.05, duration: 0.45 }}
              onClick={() => handleBookClick(book.name)}
              className={`relative h-full cursor-pointer flex-col justify-between rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                index >= 4
                  ? 'hidden xl:flex'
                  : index >= 2
                    ? 'hidden sm:flex'
                    : 'flex'
              }`}
            >
              {/* Top part: Icon, name and menu */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl p-3 bg-primary-50 text-primary-600">
                    <BookOpenIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold capitalize text-[var(--text)]">{book.name}</h3>
                    <p className="text-xs text-slate-500">{getRelativeTime(book.createdAt, text)}</p>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    if (node) menuRefs.current.set(book.name, node)
                    else menuRefs.current.delete(book.name)
                  }}
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpenMenuName(openMenuName === book.name ? null : book.name)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>

                  {openMenuName === book.name && (
                    <div className="absolute right-0 top-10 z-20 w-40 rounded-xl bg-white p-1 text-slate-800 shadow-xl border border-slate-100">
                      <button
                        onClick={() => {
                          setOpenMenuName(null)
                          setRenameTargetName(book.name)
                          setRenameNewName(book.name)
                          setError('')
                          setIsRenameOpen(true)
                        }}
                        className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 transition"
                      >
                        {text.rename || 'Rename'}
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(book.name, e)}
                        className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition"
                      >
                        {text.delete || 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom part: Balance Display */}
              <div className="mt-5 border-t border-slate-50 pt-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-light uppercase tracking-wider text-slate-400">{text.netBalance}</p>
                    <p className={`mt-1 text-xl font-bold tracking-tight ${balance >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
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

      {/* Add Book Modal */}
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
    </section>
  )
}
