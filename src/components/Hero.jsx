import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, PlayCircleIcon } from '@heroicons/react/24/outline'

export default function Hero(){
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-16 sm:pb-24">
      <div className="floating-bg mesh-bg" />
      <div className="absolute inset-x-0 top-0 z-0 h-72 bg-gradient-to-b from-primary-100/70 via-transparent to-transparent" />

      <div className="container-max relative z-10 mx-auto grid grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:items-center">
        <div className="relative lg:col-span-6 xl:pr-8">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="inline-flex items-center rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary-800 shadow-sm">
            Premium finance workspace
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }} className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.05] text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] sm:text-5xl lg:text-6xl">
            Manage Your Money Smarter
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.5 }} className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Track expenses, manage organizations, customize modules, and monitor your finances effortlessly with a clean Wallet-inspired workspace.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.5 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:shadow-primary-500/30">
              Get Started Free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a href="#analytics" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-white px-6 py-3.5 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <PlayCircleIcon className="h-5 w-5 text-primary-600" />
              Watch Demo
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.5 }} className="mt-8 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            {['Multi-organization support', 'Smart analytics', 'Fast transaction entry'].map((item) => (
              <div key={item} className="rounded-full border border-primary-100 bg-white px-4 py-2 font-medium text-[var(--text)] shadow-sm">
                {item}
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative lg:col-span-6">
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }} className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -left-8 top-8 h-24 w-24 rounded-full bg-primary-400/25 blur-3xl" />
            <div className="absolute right-4 top-0 h-28 w-28 rounded-full bg-primary-200/70 blur-3xl" />
            <div className="card-floating relative overflow-hidden rounded-[2rem] p-4 sm:p-5 lg:p-6">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/40 to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">Total balance</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--text)]">$12,482.00</p>
                </div>
                <div className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  +8.2% this month
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: 'Revenue', value: '$8,120' },
                  { label: 'Expenses', value: '$2,320' },
                  { label: 'Savings', value: '$2,042' },
                ].map((card, index) => (
                  <motion.div key={card.label} animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 5.5, delay: index * 0.6 }} className="rounded-2xl border border-primary-100 bg-gradient-to-br from-white to-primary-50/70 p-4 shadow-sm">
                    <p className="text-xs font-medium text-[var(--muted)]">{card.label}</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text)]">{card.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Spending</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">Monthly overview</p>
                    </div>
                    <div className="h-11 w-11 rounded-full border-[6px] border-primary-100 border-t-primary-500" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {[74, 56, 88].map((width, index) => (
                      <div key={index} className="space-y-1">
                        <div className="h-2 rounded-full bg-primary-50">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: 0.35 + index * 0.12, duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary-100 bg-primary-500 p-4 text-white shadow-lg shadow-primary-500/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Insights</p>
                  <p className="mt-2 text-lg font-semibold">Track trends in real time</p>
                  <div className="mt-5 flex items-end gap-2">
                    {[24, 38, 28, 52, 46, 64].map((height, index) => (
                      <motion.span key={index} initial={{ height: 0 }} animate={{ height: `${height}px` }} transition={{ delay: 0.45 + index * 0.08, duration: 0.65 }} className="block w-3 rounded-full bg-white/90" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-primary-100 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">Next payout</p>
                  <p className="text-sm font-semibold text-[var(--text)]">Salary · Freelancing · Dividends</p>
                </div>
                <div className="soft-ring flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white">+
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
