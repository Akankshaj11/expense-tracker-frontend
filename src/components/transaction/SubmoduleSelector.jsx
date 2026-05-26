// Repo file header
import { useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PlusIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { translateText, translateModuleLabel, translateSubmoduleLabel } from '../../i18n/translations'
import { appendSubmoduleToModule, persistOrganizationModules } from '../../utils/organizationPersistence'

const CARD_SURFACE_STYLES = [
  'border-amber-200 bg-amber-50',
  'border-primary-200 bg-primary-50',
  'border-sky-200 bg-sky-50',
  'border-emerald-200 bg-emerald-50',
]

const CARD_TEXT_STYLES = [
  'text-amber-700',
  'text-primary-700',
  'text-sky-700',
  'text-emerald-700',
]

const SCROLL_MAX_HEIGHT = 'max-h-[11rem]'
const SCROLL_STEP_PX = 300

const SELECTED_SURFACE_STYLES = [
  'border-amber-300 bg-amber-100 shadow-[0_0_0_1px_rgba(212,175,55,0.12)]',
  'border-primary-300 bg-primary-100 shadow-[0_0_0_1px_rgba(15,74,166,0.12)]',
  'border-sky-300 bg-sky-100 shadow-[0_0_0_1px_rgba(14,165,164,0.12)]',
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

  // Function: scrollList
  const scrollList = (direction) => {
    const container = listRef.current
    if (!container) return
    container.scrollBy({ top: direction === 'up' ? -SCROLL_STEP_PX : SCROLL_STEP_PX, behavior: 'smooth' })
  }

  // Function: createCustomSubmodule
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
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setCreatingCustomSubmodule(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-100"
            aria-label={text.createCustomSubmodule}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          {needsScroll ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-light text-slate-700">
          {/* {selectedModuleName || text.selectModule} */}
          {selectedModuleName
            ? translateModuleLabel(language, selectedModuleName)
            : text.selectModule}
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
                  {/* <p className="text-base font-light capitalize">{submodule}</p> */}
                  <p className="text-base font-light capitalize">
                    {translateSubmoduleLabel(language, submodule)}
                  </p>
                  <p className="mt-0.5 text-xs opacity-80">{text.clickToContinue}</p>
                </div>
                <Squares2X2Icon className="h-5 w-5 shrink-0 opacity-90" />
              </motion.button>
            )
          })}
        </div>
      </div>

      {creatingCustomSubmodule ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-3 py-4 backdrop-blur-sm" onClick={() => setCreatingCustomSubmodule(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-glass"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-light uppercase tracking-[0.24em] text-primary-600">{text.createCustomSubmodule}</p>
            <h3 className="mt-2 text-xl font-light tracking-tight text-slate-800">{text.newSubmodulePlaceholder}</h3>

            <div className="mt-4">
              <input
                type="text"
                value={customSubmoduleDraft}
                onChange={(e) => setCustomSubmoduleDraft(e.target.value)}
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && customSubmoduleDraft.trim()) {
                    e.preventDefault()
                    await createCustomSubmodule(customSubmoduleDraft.trim())
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-light text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
                placeholder={text.newSubmodulePlaceholder}
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreatingCustomSubmodule(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-light text-slate-700 transition hover:bg-slate-50"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (customSubmoduleDraft.trim()) {
                    await createCustomSubmodule(customSubmoduleDraft.trim())
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-light text-white"
              >
                <PlusIcon className="h-4 w-4" />
                {text.addSubmodule}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </>
  )
}
