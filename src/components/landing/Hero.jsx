import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, PlayCircleIcon } from '@heroicons/react/24/outline'

/* ARCHIVED BALANCE CARD - To be used on dashboard/analytics pages later
<div className="relative lg:col-span-6">
  <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }} className="relative mx-auto w-full max-w-[560px]">
    <div className="absolute -left-8 top-8 h-24 w-24 rounded-full bg-primary-400/25 blur-3xl" />
    <div className="absolute right-4 top-0 h-28 w-28 rounded-full bg-primary-200/70 blur-3xl" />
    <div className="card-floating glass-card relative overflow-hidden rounded-[2rem] p-4 sm:p-5 lg:p-6">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-light text-[var(--muted)]">Total balance</p>
          <p className="mt-1 text-3xl font-light tracking-tight text-white">$12,482.00</p>
        </div>
          <div className="rounded-full px-3 py-1 text-xs font-light" style={{background:'linear-gradient(90deg, rgba(15,74,166,0.12), rgba(14,165,164,0.12))', color:'#fff'}}>
          +8.2% this month
        </div>
      </div>
          <div className="mt-6 grid grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'BTC', value: '6.0286', from: '#d4af37', to: '#c9a227' },
          { label: 'DOGE', value: '16.800', from: '#0f4aa6', to: '#0b3a84' },
          { label: 'ETH', value: '0.0086', from: '#06B6D4', to: '#06B6D4' },
          { label: 'USDT', value: '7.860', from: '#111827', to: '#0F172A' },
        ].map((card, index) => (
          <motion.div key={card.label} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 5.5, delay: index * 0.6 }} className="rounded-2xl p-4 shadow-sm" style={{background:`linear-gradient(135deg, ${card.from}, ${card.to})`, color:'#fff'}}>
            <p className="text-xs font-light">{card.label}</p>
            <p className="mt-1 text-lg font-light">{card.value}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-primary-100 bg-white/4 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-light uppercase tracking-[0.2em] text-[var(--muted)]">Spending</p>
              <p className="mt-1 text-sm font-light text-[var(--text)]">Monthly overview</p>
            </div>
            <div className="h-11 w-11 rounded-full border-[6px] border-primary-100 border-t-primary-500" />
          </div>
          <div className="mt-4 space-y-3">
            {[74, 56, 88].map((width, index) => (
              <div key={index} className="space-y-1">
                <div className="h-2 rounded-full bg-white/8">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: 0.35 + index * 0.12, duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-primary-100 bg-primary-500 p-4 text-white shadow-lg shadow-primary-500/20">
          <p className="text-xs font-light uppercase tracking-[0.2em] text-white/75">Insights</p>
          <p className="mt-2 text-lg font-light">Track trends in real time</p>
          <div className="mt-5 flex items-end gap-2">
            {[24, 38, 28, 52, 46, 64].map((height, index) => (
              <motion.span key={index} initial={{ height: 0 }} animate={{ height: `${height}px` }} transition={{ delay: 0.45 + index * 0.08, duration: 0.65 }} className="block w-3 rounded-full bg-white/85" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-primary-100 bg-white/4 px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-light text-[var(--muted)]">Next payout</p>
          <p className="text-sm font-light text-[var(--text)]">Salary · Freelancing · Dividends</p>
        </div>
        <div className="soft-ring flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white">+</div>
      </div>
    </div>
  </motion.div>
</div>
*/

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden min-h-screen flex flex-col items-center justify-center">
      <div className="floating-bg mesh-bg" />

      <div className="container-max relative z-10 mx-auto flex flex-col items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-2xl text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="inline-flex items-center rounded-full border border-primary-200 bg-white/6 px-4 py-2 text-xs font-light uppercase tracking-[0.28em] text-white shadow-sm drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Premium finance workspace
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="mt-8 max-w-2xl text-4xl font-light leading-[1.05] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] sm:text-5xl lg:text-6xl">
            Smart Spending. <span className="letter-outline text-[var(--primary-500)]">Premium Experience.</span>
          </motion.h1>

          <motion.p
  initial={{ opacity: 0, y: 14 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.16, duration: 0.5 }}
  className="mt-8 max-w-2xl text-center text-base sm:text-lg leading-7 text-zinc-300 mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
>
Stay organized, track every transaction, and experience smarter money management in a modern workspace built for clarity and control.
          </motion.p>


          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.5 }} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3.5 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/30 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
              Get Started Free
              <ArrowRightIcon className="h-4 w-4 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
            </Link>
            <a href="#analytics" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-white/6 px-6 py-3.5 text-sm font-light text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
              <PlayCircleIcon className="h-5 w-5 text-primary-600 drop-shadow-[0_0_6px_rgba(122,0,153,0.4)]" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.5 }} className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
            {['Multi-organization support', 'Smart analytics', 'Fast transaction entry'].map((item) => (
              <div key={item} className="rounded-full border border-primary-100 bg-white/6 px-4 py-2 font-light text-white shadow-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
