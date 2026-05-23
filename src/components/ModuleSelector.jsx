import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { translateText } from '../i18n/translations'
import { appendCustomModule, persistOrganizationModules } from '../utils/organizationPersistence'

const SCROLL_MAX_HEIGHT = 'max-h-[14rem]'
const SCROLL_STEP_PX = 300

const MODULE_PALETTE = {
  revenue: { backgroundColor: '#16a34a', borderColor: '#16a34a', boxShadow: '0 10px 24px rgba(22, 163, 74, 0.22)' },
  expenses: { backgroundColor: '#ef4444', borderColor: '#ef4444', boxShadow: '0 10px 24px rgba(239, 68, 68, 0.22)' },
  investments: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', boxShadow: '0 10px 24px rgba(139, 92, 246, 0.22)' },
}

const CUSTOM_PALETTE = [
  { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9', boxShadow: '0 10px 24px rgba(14, 165, 233, 0.22)' },
  { backgroundColor: '#f59e0b', borderColor: '#f59e0b', boxShadow: '0 10px 24px rgba(245, 158, 11, 0.22)' },
  { backgroundColor: '#d946ef', borderColor: '#d946ef', boxShadow: '0 10px 24px rgba(217, 70, 239, 0.22)' },
  { backgroundColor: '#06b6d4', borderColor: '#06b6d4', boxShadow: '0 10px 24px rgba(6, 182, 212, 0.22)' },
]

const GRID_COLUMNS = 3

/** Distinct card colors for row 2+ (index 3 and beyond in a 3-column grid). */
const LOWER_ROW_PALETTE = [
  { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9', boxShadow: '0 10px 24px rgba(14, 165, 233, 0.22)' },
  { backgroundColor: '#f59e0b', borderColor: '#f59e0b', boxShadow: '0 10px 24px rgba(245, 158, 11, 0.22)' },
  { backgroundColor: '#ec4899', borderColor: '#ec4899', boxShadow: '0 10px 24px rgba(236, 72, 153, 0.22)' },
  { backgroundColor: '#84cc16', borderColor: '#84cc16', boxShadow: '0 10px 24px rgba(132, 204, 22, 0.22)' },
  { backgroundColor: '#f97316', borderColor: '#f97316', boxShadow: '0 10px 24px rgba(249, 115, 22, 0.22)' },
  { backgroundColor: '#6366f1', borderColor: '#6366f1', boxShadow: '0 10px 24px rgba(99, 102, 241, 0.22)' },
  { backgroundColor: '#14b8a6', borderColor: '#14b8a6', boxShadow: '0 10px 24px rgba(20, 184, 166, 0.22)' },
  { backgroundColor: '#a855f7', borderColor: '#a855f7', boxShadow: '0 10px 24px rgba(168, 85, 247, 0.22)' },
  { backgroundColor: '#e11d48', borderColor: '#e11d48', boxShadow: '0 10px 24px rgba(225, 29, 72, 0.22)' },
]

function getModuleCardStyle(module, index) {
  const category = module.category || 'revenue'
  const rowIndex = Math.floor(index / GRID_COLUMNS)

  if (rowIndex === 0) {
    if (category === 'custom') {
      return CUSTOM_PALETTE[index % CUSTOM_PALETTE.length]
    }
    return MODULE_PALETTE[category] || MODULE_PALETTE.revenue
  }

  return LOWER_ROW_PALETTE[index % LOWER_ROW_PALETTE.length]
}

export default function ModuleSelector({
  moduleOptions,
  activeOrganization,
  organizations,
  setOrganizations,
  customModuleDraft,
  setCustomModuleDraft,
  language,
  text,
  onModuleSelect,
  onCustomModuleCreated,
}) {
  const listRef = useRef(null)
  const [, setCreatingCustomModule] = useState(false)

  const cellCount = moduleOptions.length + 1
  const needsScroll = useMemo(() => {
    const rowsDesktop = Math.ceil(cellCount / 3)
    return rowsDesktop > 3 || cellCount > 3
  }, [cellCount])

  const scrollList = (direction) => {
    const container = listRef.current
    if (!container) return
    container.scrollBy({ top: direction === 'up' ? -SCROLL_STEP_PX : SCROLL_STEP_PX, behavior: 'smooth' })
  }

  const createCustomModule = async (name) => {
    const nextOrgs = appendCustomModule(organizations, activeOrganization.id, name, customModuleType)
    setCustomModuleDraft('')
    setCreatingCustomModule(false)
    await persistOrganizationModules(activeOrganization.id, nextOrgs, setOrganizations)
    onCustomModuleCreated(name)
  }

  const [customModuleType, setCustomModuleType] = useState('revenue')

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.chooseModuleLabel}</p>
        {needsScroll ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => scrollList('up')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-primary-300 hover:text-primary-700"
              aria-label={translateText(language, 'scrollUp')}
            >
              <ArrowLeftIcon className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => scrollList('down')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-primary-300 hover:text-primary-700"
              aria-label={translateText(language, 'scrollDown')}
            >
              <ArrowLeftIcon className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={listRef}
        className={`mt-4 px-3 pb-3 pt-2 ${needsScroll ? `${SCROLL_MAX_HEIGHT} overflow-y-auto overscroll-y-contain` : ''}`}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {moduleOptions.map((module, index) => {
            const category = module.category || 'revenue'
            const label = module.name || category
            const style = getModuleCardStyle(module, index)

            return (
              <motion.button
                key={`${label}-${index}`}
                type="button"
                onClick={() => onModuleSelect(module, category, label)}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut', delay: index * 0.04 }}
                whileHover={{ y: -2 }}
                className="flex min-h-[6rem] flex-col items-center justify-center rounded-[1.25rem] border px-4 py-3 text-center text-white transition-shadow hover:shadow-md"
                style={style}
              >
                <p className="text-md font-light">{label}</p>
                <p className="mt-0.5 text-xs text-white/80">{text.chooseModuleHint}</p>
              </motion.button>
            )
          })}

          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut', delay: 0.16 }}
              className="flex min-h-[6rem] items-start justify-start rounded-[1.25rem] border border-slate-300 bg-white px-3 py-3 text-slate-500 shadow-[0_0_0_1px_rgba(148,163,184,0.12)] hover:border-primary-500 hover:bg-blue-50"
              onClick={() => setCreatingCustomModule(true)}
            >
              <div className="w-full">
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={customModuleDraft}
                    onChange={(e) => setCustomModuleDraft(e.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onFocus={() => setCreatingCustomModule(true)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (customModuleDraft.trim()) {
                          await createCustomModule(customModuleDraft.trim())
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-light text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                    placeholder={text.newModulePlaceholder}
                  />

                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (customModuleDraft.trim()) {
                        await createCustomModule(customModuleDraft.trim())
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-2 py-1.5 text-primary-700"
                    aria-label={translateText(language, 'addModule')}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 w-full">
                  <div className="mt-2 flex items-center gap-2">
                    {[
                      { value: 'revenue', label: 'Revenue', title: 'Revenue', selectedClass: 'border-emerald-500 bg-emerald-500 text-white' },
                      { value: 'expense', label: 'Expense', title: 'Expense', selectedClass: 'border-red-500 bg-red-500 text-white' },
                    ].map((item) => {
                      const isActive = customModuleType === item.value
                      return (
                        <button
                          key={item.value}
                          type="button"
                          title={item.title}
                          aria-label={item.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCustomModuleType(item.value)
                          }}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition ${isActive ? item.selectedClass : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
