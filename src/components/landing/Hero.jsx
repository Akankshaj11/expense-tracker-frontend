// Repo file header
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, PlayCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

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
    <section className="relative min-h-screen lg:h-screen flex items-center justify-center bg-[url('/finance_hero_bg.png')] bg-cover bg-center overflow-hidden pt-24 pb-12 lg:py-0">
      {/* Premium dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950/95 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
      
      <div className="container-max relative z-10 mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Side: Text and CTAs */}
          <div className="lg:col-span-6 flex flex-col space-y-4 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.45 }}
              className="self-start inline-flex items-center rounded-full border border-primary-200/30 bg-primary-500/10 px-3.5 py-1.5 text-[10px] font-light uppercase tracking-[0.25em] text-primary-400 shadow-sm"
            >
              Premium finance workspace
            </motion.div>

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

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="text-sm sm:text-base leading-6 text-zinc-400 max-w-xl"
            >
              Stay organized, track every transaction, and experience smarter money management in a modern workspace built for clarity and control.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 14 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.24, duration: 0.5 }} 
              className="flex flex-col sm:flex-row gap-3 pt-1"
            >
              <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-xs sm:text-sm font-medium text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/40">
                Get Started Free
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-white/5 px-6 py-3 text-xs sm:text-sm font-medium text-white transition hover:bg-white/10 hover:-translate-y-0.5">
                <PlayCircleIcon className="h-5 w-5 text-primary-400" />
                Explore Features
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.32, duration: 0.5 }} 
              className="flex flex-wrap gap-2.5 text-[13px] pt-2"
            >
              {['Multi-org support', 'Smart analytics', 'Fast transaction entry'].map((item) => (
                <div key={item} className="rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 font-normal text-zinc-300">
                  ✓ {item}
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Right Side: Stats, Ratings & Reviews */}
          <div className="lg:col-span-6 flex flex-col space-y-4 w-full pt-8 lg:pt-12">
            
            {/* Trustpilot-style Rating Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div
                className="animate-bob-1 glass-card rounded-[1.75rem] p-5 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300"
              >
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-500/10 blur-2xl group-hover:bg-primary-500/20 transition-all duration-500" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Average Rating</p>
                    <p className="text-3xl font-bold text-white mt-0.5">4.9 / 5.0</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} className="h-5 w-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1.5">1,200+ Verified Reviews</span>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-center">
                  <p className="text-[11px] text-zinc-400 font-light">
                    Trusted by <span className="font-semibold text-white">10,000+</span> teams worldwide.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Testimonial Quote Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div
                className="animate-bob-2 glass-card rounded-[1.75rem] p-5 border border-white/10 shadow-2xl relative hover:border-cyan-500/30 transition-all duration-300"
              >
                <p className="text-xs sm:text-sm italic leading-5.5 text-zinc-300 font-light">
                  "PocketFlow completely changed how we handle team expenses. Switching between organizations takes one click, and downloading monthly PDF reports has cut our accounting overhead in half!"
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-semibold">
                    MK
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Marcus K.</h4>
                    <p className="text-[10px] text-zinc-400">Founder at CloudScale</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PWA Install Promo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <button
                onClick={handleInstallClick}
                className="animate-bob-3 w-full flex items-center justify-between rounded-[1.75rem] bg-white/5 border border-white/5 px-6 py-6 shadow-sm hover:border-emerald-500/30 hover:bg-white/10 active:scale-[0.98] transition-all duration-300 cursor-pointer text-left focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-500/10 rounded-xl text-primary-400">
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">Platform Support</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Install Desktop & Mobile App</p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-light">Compatible with iOS, Android, macOS & Windows</p>
                  </div>
                </div>
                <span className="text-[10px] text-primary-400 font-medium select-none hover:text-primary-300 whitespace-nowrap ml-2">
                  {isInstallable ? 'Install Now' : 'Ready to Install'}
                </span>
              </button>
            </motion.div>
            
          </div>
          
        </div>
      </div>
    </section>
  )
}

