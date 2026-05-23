import { motion } from 'framer-motion'
import { EllipsisVerticalIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

export default function DashboardModulesSection({ text, moduleCards, onModuleClick }) {
  return (
    <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.modules}</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.modulesYouAdded}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-light text-primary-700">
          <Squares2X2Icon className="h-4 w-4" />
          {moduleCards.length} {text.modules.toLowerCase()}
        </div>
      </div>

      <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {moduleCards.map((module, index) => (
          <motion.article
            key={module.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: index * 0.05, duration: 0.45 }}
            onClick={() => onModuleClick(module.label)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onModuleClick(module.label)
              }
            }}
            className="flex h-full cursor-pointer flex-col rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3" style={{ backgroundColor: module.theme.iconBg, color: module.theme.fg }}>
                  <module.theme.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-light capitalize text-[var(--text)]">{module.label}</p>
                  <p className="text-sm text-slate-500">{module.submodules.length} {text.submodules.toLowerCase()}</p>
                </div>
              </div>
              <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-[var(--card)] hover:text-[var(--muted)]">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-light uppercase tracking-[0.2em] text-slate-500">{text.amount}</p>
                <p className={`mt-2 inline-flex items-center gap-1 text-2xl font-light tracking-tight ${module.amountValue < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                  <span>{module.amountValue < 0 ? '-' : module.amountValue > 0 ? '+' : ''}</span>
                  <span>{module.amount}</span>
                </p>
              </div>
              <div className="text-right text-xs font-light text-slate-500">{text.allocated}</div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-[var(--card)]">
              <div className="h-full rounded-full" style={{ width: `${module.fill}%`, backgroundColor: module.theme.fg }} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {module.submodules.map((submodule) => (
                <span key={submodule} className="rounded-full bg-[var(--card)] px-3 py-1.5 text-xs font-light text-[var(--muted)] shadow-sm ring-1 ring-slate-200">
                  {submodule}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}