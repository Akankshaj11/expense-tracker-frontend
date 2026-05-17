import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDownIcon, Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'

export default function Navbar(){
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(()=>{
    function onScroll(){ setScrolled(window.scrollY>20) }
    window.addEventListener('scroll', onScroll)
    return ()=>window.removeEventListener('scroll', onScroll)
  },[])

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'glass shadow-glass' : 'bg-transparent'}`}
    >
      <div className="container-max mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20 flex items-center justify-center font-bold">FT</div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">FinTrack</div>
              <div className="font-semibold text-[var(--text)]">Wallet App</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-[var(--muted)]">
            {['Features', 'Modules', 'Analytics', 'Pricing', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="group relative transition-colors hover:text-[var(--text)]">
                {item}
                <span className="absolute left-0 -bottom-1 h-px w-0 bg-primary-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <button className="inline-flex items-center gap-1 text-[var(--muted)] transition hover:text-[var(--text)]">
              Organization
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:-translate-y-0.5 hover:shadow-lg">
              Login
            </Link>
            <Link to="/register" className="inline-flex items-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/30">
              Get Started
            </Link>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-[var(--text)] transition hover:shadow-lg">
              <UserCircleIcon className="h-5 w-5" />
            </button>
          </div>

          <button className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-[var(--text)]" onClick={() => setMobileOpen((prev) => !prev)} aria-label="Toggle menu">
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="md:hidden border-t border-white/60 bg-white/90 px-4 pb-5 pt-3 shadow-lg backdrop-blur-xl"
          >
            <div className="container-max mx-auto flex flex-col gap-3 text-sm text-[var(--text)]">
              {['Features', 'Modules', 'Analytics', 'Pricing', 'About'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="rounded-xl px-3 py-3 transition hover:bg-primary-50" onClick={() => setMobileOpen(false)}>
                  {item}
                </a>
              ))}
              <div className="mt-2 flex gap-3">
                <Link to="/login" className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-3 font-medium text-center">Login</Link>
                <Link to="/register" className="flex-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 font-semibold text-white text-center">Get Started</Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}
