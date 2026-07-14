// Repo file header
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDownIcon, Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import logo from '../../assets/logo.png'

export default function Navbar(){
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(()=>{
    // Function: onScroll
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
            <img src={logo} alt="PocketFlow Logo" className="h-11 w-11 object-contain" />
            <div>
              <div className="text-[18px] pt-1 text-blue-500 font-semibold">PocketFlow</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm">
            {[
              {label: 'About', to: '/#about'},
              {label: 'Features', to: '/#features'},
              {label: 'Analytics', to: '/#analytics'},
              {label: 'Pricing', to: '/#pricing'},
            ].map((item) => (
              <Link key={item.label} to={item.to} className="group relative text-white/60 hover:text-white transition-colors">
                {item.label}
                <span className="absolute left-0 -bottom-2 h-0.5 w-0 bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 group-hover:w-full rounded" />
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/6 px-4 py-2 text-sm font-light text-white transition hover:-translate-y-0.5 hover:shadow-lg">
              Login
            </Link>
            <Link to="/register" className="inline-flex items-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/30">
              Get Started
            </Link>
          </div>

          <button className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/6 text-white" onClick={() => setMobileOpen((prev) => !prev)} aria-label="Toggle menu">
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
            className="md:hidden border-t border-white/20 bg-white/6 px-4 pb-5 pt-3 shadow-lg backdrop-blur-xl"
          >
            <div className="container-max mx-auto flex flex-col gap-3 text-sm text-white">
              {[
                {label: 'About', to: '/#about'},
                {label: 'Features', to: '/#features'},
                {label: 'Analytics', to: '/#analytics'},
                {label: 'Pricing', to: '/#pricing'},
              ].map((item) => (
                  <Link key={item.label} to={item.to} className="rounded-xl px-3 py-3 transition hover:bg-white/10 hover:text-white" onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              <div className="mt-2 flex gap-3">
                <Link to="/login" className="flex-1 rounded-full border border-white/12 bg-white/6 px-4 py-3 font-light text-center">Login</Link>
                <Link to="/register" className="flex-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 font-light text-white text-center">Get Started</Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}
