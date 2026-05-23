import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EllipsisVerticalIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

function getModuleTypeBadge(module) {
  if (!module?.isCustom || !module?.transactionType) {
    return null
  }

  if (module.transactionType === 'revenue') {
    return {
      label: 'R',
      className: 'bg-emerald-500 text-white',
    }
  }

  if (module.transactionType === 'expenses') {
    return {
      label: 'E',
      className: 'bg-rose-500 text-white',
    }
  }

  return null
}

export default function DashboardModulesSection({ text, moduleCards, onModuleClick }) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const navigate = useNavigate()

  const handleView = (moduleLabel) => {
    if (onModuleClick) onModuleClick(moduleLabel)
    setOpenMenuId(null)
  }

  const handleEdit = (moduleLabel) => {
    // navigate to manage page with query param for editing
    navigate(`/manage-organization?editModule=${encodeURIComponent(moduleLabel)}`)
    setOpenMenuId(null)
  }

  const handleDelete = (moduleLabel) => {
    const confirmed = window.confirm(`Delete module "${moduleLabel}"? This cannot be undone.`)
    if (confirmed) {
      // navigate to manage page with delete query — handled there if implemented
      navigate(`/manage-organization?deleteModule=${encodeURIComponent(moduleLabel)}`)
    }
    setOpenMenuId(null)
  }

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
            className="relative flex h-full cursor-pointer flex-col rounded-[1.5rem] border border-white/6 bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {(() => {
              const typeBadge = getModuleTypeBadge(module)

              return (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3" style={{ backgroundColor: module.theme.iconBg, color: module.theme.fg }}>
                  <module.theme.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-light capitalize text-[var(--text)]">{module.label}</p>
                    {typeBadge ? (
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${typeBadge.className}`}
                        aria-label={module.transactionType === 'revenue' ? 'Revenue module' : 'Expense module'}
                        title={module.transactionType === 'revenue' ? 'Revenue module' : 'Expense module'}
                      >
                        {typeBadge.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500">{module.submodules.length} {text.submodules.toLowerCase()}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(openMenuId === module.id ? null : module.id)
                  }}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-[var(--card)] hover:text-[var(--muted)]"
                  aria-label="Module actions"
                >
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>

                {openMenuId === module.id ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-white/6 bg-[var(--card)] py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => handleView(module.label)}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-white/5"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(module.label)}
                      className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(module.label)}
                      className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-white/5"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
              )
            })()}

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

            {module.recentTransaction ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/40 px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-light text-[var(--text)]">{module.recentTransaction.submodule}</span>
                  <span className={module.recentTransaction.amountValue < 0 ? 'shrink-0 font-light text-rose-600' : 'shrink-0 font-light text-emerald-600'}>
                    {module.recentTransaction.amount}
                  </span>
                </div>
              </div>
            ) : null}

          </motion.article>
        ))}
      </div>
    </section>
  )
}