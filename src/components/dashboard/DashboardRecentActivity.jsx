// Repo file header
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function DashboardRecentActivity({ text, recentActivity }) {
  return (
    <div className="rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.recentActivity}</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.latestUpdates}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="rounded-full border border-white/6 bg-[var(--card)] px-4 py-2 text-sm font-light text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {text.seeAll}
          </Link>
          <div className="rounded-full bg-primary-50 p-3 text-primary-600">
            <CalendarDaysIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {recentActivity.length > 0 ? (
        <div className="mt-6 space-y-3">
          {recentActivity.map((item, index) => (
            <Link
              key={item.id}
              to={item.editPath}
              className="block rounded-2xl border border-white/6 bg-[var(--card)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="flex items-center justify-between rounded-2xl px-4 py-4"
              >
                <div>
                  <p className="font-light text-[var(--text)]">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.meta}</p>
                </div>
                <p className={`text-sm font-light ${item.tone}`}>{item.amount}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-[var(--card)] px-4 py-6 text-sm text-slate-500">
          {text.noTransactionsYet}
        </div>
      )}
    </div>
  )
}