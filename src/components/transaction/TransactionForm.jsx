import {
  CheckCircleIcon,
  ClockIcon,
  PaperClipIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { translateText } from '../../i18n/translations'
import {
  buildAmountExpression,
  formatMoney,
  removeTokenFromExpression,
} from '../../utils/transactionHelpers'

export default function TransactionForm({
  isEditMode,
  text,
  language,
  locale,
  selectedCurrency,
  selectedModuleName,
  selectedSubmodule,
  amountDisplayValue,
  amountExpression,
  setAmountExpression,
  previewAmount,
  tokens,
  note,
  setNote,
  attachment,
  setAttachment,
  date,
  setDate,
  time,
  setTime,
  error,
  savedMessage,
  canSave,
  isSaving,
  saveButtonLabel,
  secondaryButtonLabel,
  onBack,
  onChangeModule,
  onSave,
  onSaveAndAddAnother,
}) {
  return (
    <section className="mt-6">
      <div className="inner-card-accent rounded-[1.75rem] border border-white/6 bg-[var(--card)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.transactionForm}</p>
            <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">
              {isEditMode ? text.editTransaction : text.transactionForm}
              {selectedModuleName ? ` · ${selectedModuleName}` : ''}
              {selectedSubmodule ? ` · ${selectedSubmodule}` : ''}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <button
                type="button"
                onClick={onChangeModule}
                className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-100"
              >
                {text.changeModule}
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-white/6 bg-[var(--card)] px-4 py-2 text-sm font-light text-[var(--muted)]"
              >
                {text.back}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-light text-slate-700">{text.enterAmount}</label>
            <div className="relative rounded-xl border border-primary-500 bg-[var(--card)] px-3 py-2.5 shadow-[0_0_0_1px_rgba(59,130,246,0.08)] focus-within:ring-2 focus-within:ring-primary-500/20">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-light text-[var(--text)]">
                <span className="currency-symbol">{selectedCurrency?.symbol || '$'}</span>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-light text-slate-500">
                {previewAmount !== null ? formatMoney(previewAmount, selectedCurrency, locale) : ''}
              </div>
              <input
                type="text"
                value={amountDisplayValue}
                onChange={(event) => {
                  setAmountExpression((currentExpression) =>
                    buildAmountExpression(currentExpression, event.target.value),
                  )
                }}
                placeholder="600"
                className="w-full bg-transparent pl-7 pr-24 text-base font-light text-[var(--text)] outline-none placeholder:text-slate-400 input-glass"
              />
            </div>
          </div>

          {tokens.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-sm font-light">
              {tokens.map((token, index) =>
                /\d/.test(token) ? (
                    <span
                      key={`${token}-${index}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-primary-700 shadow-sm"
                    >
                      <span className="currency-symbol">{selectedCurrency?.symbol || '$'}</span>
                      {token}
                      <button
                        type="button"
                        onClick={() => setAmountExpression(removeTokenFromExpression(amountExpression, index))}
                        className="rounded-full p-0.5 text-primary-600 transition hover:bg-primary-100"
                        aria-label={translateText(language, 'removeAmountToken', { token })}
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </span>
                ) : (
                  <span key={`${token}-${index}`} className="px-1 text-slate-400">
                    {token}
                  </span>
                ),
              )}
            </div>
          ) : null}

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-light text-slate-700">{text.notesLabel}</label>
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={text.notesPlaceholder}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-3 py-2.5 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-light text-slate-700">{text.attachmentLabel}</label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--muted)] transition hover:border-primary-400 hover:bg-primary-50">
                  <span className="inline-flex items-center gap-2">
                    <PaperClipIcon className="h-4 w-4 text-primary-600" />
                    {attachment?.name || text.uploadFile}
                  </span>
                  <input type="file" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-light text-slate-700">{text.dateLabel}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-3 py-2.5 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-light text-slate-700">{text.timeLabel}</label>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full rounded-xl border border-white/6 bg-[var(--card)] px-3 py-2.5 text-[var(--text)] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 input-glass"
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-sm font-light text-rose-600">{error}</p> : null}
          {savedMessage ? <p className="text-sm font-light text-emerald-600">{savedMessage}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!canSave || isSaving}
              onClick={() => onSave(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full accent-cta px-5 py-3 text-sm font-light transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <ClockIcon className="h-4 w-4 animate-spin" />
                  <span>{text.saving || saveButtonLabel}</span>
                </>
              ) : (
                <>
                  {saveButtonLabel}
                  <CheckCircleIcon className="h-4 w-4" />
                </>
              )}
            </button>
            {!isEditMode ? (
              <button
                type="button"
                disabled={!canSave || isSaving}
                onClick={() => onSaveAndAddAnother(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <ClockIcon className="h-4 w-4 animate-spin" />
                    <span>{text.saving || secondaryButtonLabel}</span>
                  </>
                ) : (
                  <>
                    {secondaryButtonLabel}
                    <PlusIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
