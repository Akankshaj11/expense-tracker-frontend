import { motion } from 'framer-motion'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function DashboardModuleEditor({
  text,
  isOpen,
  onClose,
  moduleNameDraft,
  setModuleNameDraft,
  submoduleDrafts,
  addSubmoduleDraft,
  updateSubmoduleDraft,
  removeSubmoduleDraft,
  isSaving,
  error,
  onSave,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 px-3 py-3 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-light uppercase tracking-[0.24em] text-primary-600">{text.modules}</p>
            <h3 className="mt-2 text-2xl font-light tracking-tight text-slate-800">{text.modulesAndSubmodules}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            aria-label={text.cancel}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-light text-slate-700">{text.moduleNameLabel || 'Module Name *'}</label>
            <input
              type="text"
              value={moduleNameDraft}
              onChange={(event) => setModuleNameDraft(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-light text-slate-700">{text.submoduleNameLabel || 'Submodule Name *'}</label>
              <button
                type="button"
                onClick={addSubmoduleDraft}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {text.addSubmodule || 'Add Submodule'}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {submoduleDrafts.map((submodule, index) => (
                <div key={`${index}-${submodule}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submodule}
                    onChange={(event) => updateSubmoduleDraft(index, event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder={`${text.submoduleNumberPlaceholder || 'Submodule'} ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubmoduleDraft(index)}
                    className="rounded-full border border-slate-200 bg-white p-2 text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                    aria-label={text.removeSubmodule || 'Remove submodule'}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm font-light text-rose-600">{error}</p> : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-light text-slate-700 transition hover:bg-slate-50"
            >
              {text.cancel}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (text.saving || text.save) : text.save}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}