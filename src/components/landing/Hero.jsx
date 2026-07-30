// Repo file header
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, PlayCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import heroBg from '../../assets/finance_hero_bg.png'

export default function Hero() {
  const [isInstallable, setIsInstallable] = useState(!!window.deferredInstallPrompt)

  useEffect(() => {
    const handleInstallable = () => {
      setIsInstallable(true)
    }
    
    window.addEventListener('pwa-installable', handleInstallable)

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      window.deferredInstallPrompt = e
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false)
    }

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    const promptEvent = window.deferredInstallPrompt
    if (promptEvent) {
      promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') {
        window.deferredInstallPrompt = null
        setIsInstallable(false)
      }
    } else {
      alert("To install PocketFlow:\n\n1. On Desktop (Chrome/Edge/Brave): Click the Install icon in the browser address bar.\n2. On Mobile (iOS Safari): Tap the Share button and select 'Add to Home Screen'.\n3. On Mobile (Chrome Android): Tap the three-dot menu and select 'Install app'.")
    }
  }

  return (
    <section 
      style={{ backgroundImage: `url(${heroBg})` }}
      className="relative min-h-screen lg:h-screen flex items-center justify-center bg-cover bg-center overflow-hidden pt-24 pb-12 lg:py-0"
    >
      {/* Premium dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
      
      {/* Animated premium ambient glow background blobs */}
      <div className="absolute top-1/4 left-1/4 h-[24rem] w-[24rem] rounded-full bg-primary-500/10 blur-3xl animate-drift-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl animate-drift-slower pointer-events-none" />
      
      <div className="container-max relative z-10 mx-auto px-4 sm:px-6 w-full flex justify-center">
        <div className="flex flex-col items-center text-center max-w-3xl space-y-6">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.45 }}
            className="inline-flex items-center rounded-full border border-primary-200/30 bg-primary-500/10 px-4 py-1.5 text-[10px] font-light uppercase tracking-[0.25em] text-primary-400 shadow-sm"
          >
            Premium finance workspace
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.08, duration: 0.5 }} 
            className="text-3xl font-extralight leading-[1.15] text-white sm:text-4xl lg:text-5xl tracking-tight"
          >
            Smart Spending. <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400">
              Premium Experience.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5 }}
            className="text-sm sm:text-base leading-relaxed text-zinc-400 max-w-xl"
          >
            Stay organized, track every transaction, and experience smarter money management in a modern workspace built for clarity and control.
          </motion.p>

          {/* Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 14 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.24, duration: 0.5 }} 
            className="flex flex-col sm:flex-row gap-4 pt-2 justify-center w-full sm:w-auto items-center relative z-10"
          >
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/40 whitespace-nowrap group">
              Get Started Free
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-white/5 px-6 py-3 text-xs font-semibold text-white transition hover:bg-white/10 hover:-translate-y-0.5 whitespace-nowrap group">
              <PlayCircleIcon className="h-5 w-5 text-primary-400 shrink-0 group-hover:scale-110 transition-transform duration-200" />
              Explore Features
            </a>
          </motion.div>

          {/* Checklist */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.32, duration: 0.5 }} 
            className="flex flex-wrap justify-center gap-3 pt-4"
          >
            {['Multi-org support', 'Smart analytics', 'Fast transaction entry'].map((item) => (
              <motion.div 
                key={item} 
                whileHover={{ y: -3, scale: 1.03, borderColor: 'rgba(59, 130, 246, 0.4)', backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-normal text-zinc-300 cursor-pointer"
              >
                ✓ {item}
              </motion.div>
            ))}
          </motion.div>
          
          {/* Animated background floating decorative particles */}
          <div className="absolute top-1/4 left-[15%] h-1.5 w-1.5 rounded-full bg-cyan-400/50 blur-[1px] animate-bob-1 pointer-events-none" />
          <div className="absolute top-1/3 right-[20%] h-2 w-2 rounded-full bg-primary-400/40 blur-[1px] animate-bob-2 pointer-events-none" />
          <div className="absolute bottom-[40%] left-[25%] h-2 w-2 rounded-full bg-indigo-400/50 blur-[1px] animate-bob-3 pointer-events-none" />
          
        </div>
      </div>
    </section>
  )
}

