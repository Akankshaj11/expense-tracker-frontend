import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, Squares2X2Icon, TagIcon } from '@heroicons/react/24/outline'
import { translateText } from '../i18n/translations'
import { appendSubmoduleToModule, persistOrganizationModules } from '../utils/organizationPersistence'

const CARD_SURFACE_STYLES = [
  'border-orange-200 bg-orange-50',
  'border-primary-200 bg-primary-50',
  'border-violet-200 bg-violet-50',
  'border-emerald-200 bg-emerald-50',
]

const CARD_TEXT_STYLES = [
  'text-orange-700',
  'text-primary-700',
  'text-violet-700',
  'text-emerald-700',
]

const SCROLL_MAX_HEIGHT = 'max-h-[11rem]'
const SCROLL_STEP_PX = 300

const SELECTED_SURFACE_STYLES = [
  'border-orange-300 bg-orange-100 shadow-[0_0_0_1px_rgba(249,115,22,0.12)]',
  'border-primary-300 bg-primary-100 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]',
  'border-violet-300 bg-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]',
  'border-emerald-300 bg-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]',
]

export default function SubmoduleSelector({
  selectedModule,
  selectedModuleName,
  submodules,
  selectedSubmodule,
  organizations,
  setOrganizations,
  activeOrganization,
  creatingCustomSubmodule,
  setCreatingCustomSubmodule,
  customSubmoduleDraft,
  setCustomSubmoduleDraft,
  language,
  text,
  onSubmoduleSelect,
  onCustomSubmoduleCreated,
}) {
  const listRef = useRef(null)
  const cellCount = submodules.length + 1
  const needsScroll = useMemo(() => {
    const rowsDesktop = Math.ceil(cellCount / 3)
    return rowsDesktop > 3 || cellCount > 3
  }, [cellCount])

  const scrollList = (direction) => {
    const container = listRef.current
    if (!container) return
    container.scrollBy({ top: direction === 'up' ? -SCROLL_STEP_PX : SCROLL_STEP_PX, behavior: 'smooth' })
  }

  const createCustomSubmodule = async (name) => {
    const nextOrgs = appendSubmoduleToModule(organizations, activeOrganization.id, selectedModule, name)
    setCustomSubmoduleDraft('')
    setCreatingCustomSubmodule(false)
    await persistOrganizationModules(activeOrganization.id, nextOrgs, setOrganizations)
    onCustomSubmoduleCreated(name)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.allSubmodulesLabel}</p>
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

      <div className="mt-4 flex items-center gap-3">
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-light text-slate-700">
          {selectedModuleName || text.selectModule}
        </div>
      </div>

      <div
        ref={listRef}
        className={`mt-4 px-3 pb-3 pt-2 ${needsScroll ? `${SCROLL_MAX_HEIGHT} overflow-y-auto overscroll-y-contain` : ''}`}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {submodules.map((submodule, index) => {
            const isSelected = selectedSubmodule === submodule
            const paletteIndex = index % CARD_SURFACE_STYLES.length
            const surfaceTone = isSelected
              ? SELECTED_SURFACE_STYLES[paletteIndex]
              : CARD_SURFACE_STYLES[paletteIndex]
            const textTone = CARD_TEXT_STYLES[paletteIndex]

            return (
              <motion.button
                key={submodule}
                type="button"
                onClick={() => onSubmoduleSelect(submodule)}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut', delay: index * 0.04 }}
                whileHover={{ y: -2 }}
                className={`flex min-h-[4.5rem] items-center justify-between rounded-[1.25rem] border px-4 py-2.5 text-left transition-shadow hover:shadow-md ${surfaceTone} ${textTone}`}
              >
                <div>
                  <p className="text-base font-light capitalize">{submodule}</p>
                  <p className="mt-0.5 text-xs opacity-80">{text.clickToContinue}</p>
                </div>
                <Squares2X2Icon className="h-5 w-5 shrink-0 opacity-90" />
              </motion.button>
            )
          })}

          <div>
            {creatingCustomSubmodule ? (
              <div className="flex min-h-[4.5rem] items-center rounded-[1.25rem] border border-primary-400 bg-white px-4 py-2.5 text-primary-700 shadow-[0_0_0_1px_rgba(59,130,246,0.10)]">
                <input
                  type="text"
                  value={customSubmoduleDraft}
                  onChange={(e) => setCustomSubmoduleDraft(e.target.value)}
                  autoFocus
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && customSubmoduleDraft.trim()) {
                      e.preventDefault()
                      await createCustomSubmodule(customSubmoduleDraft.trim())
                    }
                  }}
                  className="h-full w-full rounded-xl border-transparent bg-transparent px-2 py-2 text-sm font-light text-black outline-none placeholder:text-slate-400 focus:border-transparent focus:outline-none"
                  placeholder={text.newSubmodulePlaceholder}
                />
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (customSubmoduleDraft.trim()) {
                      await createCustomSubmodule(customSubmoduleDraft.trim())
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-primary-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingCustomSubmodule(true)}
                className="flex min-h-[4.5rem] w-full items-center justify-between rounded-[1.25rem] border border-primary-400 bg-white px-4 py-2.5 text-left text-slate-500 shadow-[0_0_0_1px_rgba(59,130,246,0.10)] hover:border-primary-500 hover:bg-primary-50"
              >
                <span className="text-sm font-light">+ {text.createCustomSubmodule}</span>
                <TagIcon className="h-5 w-5 shrink-0 opacity-70" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
