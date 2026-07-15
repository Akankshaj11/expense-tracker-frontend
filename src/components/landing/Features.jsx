// Repo file header
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  PresentationChartBarIcon,
  Square3Stack3DIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    title: 'Manage Organizations',
    desc: 'Create, isolate, and switch between multiple companies or workgroups seamlessly with clean access rights.',
    icon: BanknotesIcon,
    glow: 'group-hover:border-primary-500/30'
  },
  {
    title: 'Custom Modules & Submodules',
    desc: 'Build deep hierarchy flows tailored exactly to your business model. Structure revenues, overhead expenses, capital investments, and departments your way without restrictions.',
    icon: Square3Stack3DIcon,
    glow: 'group-hover:border-cyan-500/30'
  },
  {
    title: 'Smart Expense Analytics',
    desc: 'Identify spending trends, anomalous recurring payments, and cost-saving insights instantly through an integrated live dashboard.',
    icon: PresentationChartBarIcon,
    glow: 'group-hover:border-indigo-500/30'
  },
  {
    title: 'Multi-Currency Operations',
    desc: 'Operate global divisions smoothly. Record local ledger values and automatically convert exchange views.',
    icon: CurrencyDollarIcon,
    glow: 'group-hover:border-amber-500/30'
  },
  {
    title: 'Attach Digital Bills & Receipts',
    desc: 'Store proof and audits right on the ledger. Upload image receipts or PDF bills to verify transactions instantly.',
    icon: DocumentArrowUpIcon,
    glow: 'group-hover:border-rose-500/30'
  },
  {
    title: 'Download Custom Reports',
    desc: 'Select a workspace module, date range, or tag, and export beautifully formatted PDF summaries or raw CSV logs for your accounting team, partners, or audits.',
    icon: ArrowDownTrayIcon,
    glow: 'group-hover:border-emerald-500/30'
  },
]

export default function Features(){
  const [activeIndex, setActiveIndex] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(3)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3)
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(2)
      } else {
        setItemsPerPage(1)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxIndex = features.length - itemsPerPage + 1

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % maxIndex)
  }

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + maxIndex) % maxIndex)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % maxIndex)
    }, 4500)
    return () => clearInterval(interval)
  }, [maxIndex])

  return (
    <section id="features" className="mt-20 scroll-mt-28 w-full">
      <div className="max-w-3xl">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Features</p>
        <h4 className="mt-2 text-2xl font-light text-white sm:text-3xl">
          Built for modern expense management
        </h4>
        <p className="mt-3 text-sm sm:text-base text-[var(--muted)]">
          A premium, modular finance workspace designed to scale with your team's complexity.
        </p>
      </div>

      {/* Carousel Container */}
      <div className="mt-10 relative flex items-center justify-center max-w-5xl mx-auto w-full px-4 sm:px-12">
        {/* Prev Button */}
        <button 
          onClick={prev} 
          className="absolute left-0 sm:left-2 z-20 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5 focus:outline-none transition-colors"
          aria-label="Previous Feature"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        {/* Slide Area */}
        <div className="w-full overflow-hidden rounded-[2rem]">
          <div 
            className="flex transition-transform duration-500 ease-in-out" 
            style={{ transform: `translateX(-${activeIndex * (100 / itemsPerPage)}%)` }}
          >
            {features.map((f, i) => (
              <div 
                key={f.title} 
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / itemsPerPage}%` }}
              >
                <motion.div 
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card rounded-[1.5rem] p-5 border border-white/5 flex flex-col justify-between relative group hover:border-primary-500/20 transition-all duration-300 min-h-[190px] h-full text-left"
                >
                  {/* Glowing border overlay */}
                  <div className={`absolute inset-0 border border-transparent rounded-[1.5rem] transition-all duration-300 ${f.glow}`} />
                  
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-primary-400 shadow-sm group-hover:bg-primary-500/15 transition-colors">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 flex-1">
                    <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-[var(--muted)] font-light">{f.desc}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Next Button */}
        <button 
          onClick={next} 
          className="absolute right-0 sm:right-2 z-20 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5 focus:outline-none transition-colors"
          aria-label="Next Feature"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: maxIndex }).map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setActiveIndex(idx)} 
            className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-5 bg-primary-500' : 'w-1.5 bg-white/15'}`} 
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  )
}


