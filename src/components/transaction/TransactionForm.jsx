import { useRef } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import {
  buildAmountExpression,
  formatMoney,
  removeTokenFromExpression
} from '../../utils/transactionHelpers'

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
}

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
  existingAttachmentName,
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
  transactionDirection,
  setTransactionDirection,
  paymentMode,
  setPaymentMode,
}) {
  const dateInputRef = useRef(null)
  const timeInputRef = useRef(null)

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker()
      } else {
        dateInputRef.current.click()
      }
    }
  }

  const triggerTimePicker = () => {
    if (timeInputRef.current) {
      if (typeof timeInputRef.current.showPicker === 'function') {
        timeInputRef.current.showPicker()
      } else {
        timeInputRef.current.click()
      }
    }
  }

  return (
    <section className="mt-14 relative">
      {/* Close Button: Positioned absolutely at the top-right corner, outside of the white card */}
      <button
        type="button"
        onClick={onBack}
        className="absolute right-0 -top-12 rounded-xl bg-white p-2.5 text-slate-400 hover:text-slate-600 border border-slate-200 shadow-sm transition z-20"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      {/* Main Container Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        
        {/* Toggle Buttons: IN & OUT (No pt-12 needed since close button is outside the card) */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setTransactionDirection('in')
            }}
            className="flex-1 py-3.5 text-center text-base font-bold rounded-2xl border transition"
            style={{
              backgroundColor: (transactionDirection === 'in' || transactionDirection === 'revenue') ? '#059669' : '#ffffff',
              borderColor: (transactionDirection === 'in' || transactionDirection === 'revenue') ? '#059669' : '#e2e8f0',
              color: (transactionDirection === 'in' || transactionDirection === 'revenue') ? '#ffffff' : '#334155'
            }}
          >
            {text.in || 'IN'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTransactionDirection('out')
            }}
            className="flex-1 py-3.5 text-center text-base font-bold rounded-2xl border transition"
            style={{
              backgroundColor: (transactionDirection === 'out' || transactionDirection === 'expenses') ? '#dc2626' : '#ffffff',
              borderColor: (transactionDirection === 'out' || transactionDirection === 'expenses') ? '#dc2626' : '#e2e8f0',
              color: (transactionDirection === 'out' || transactionDirection === 'expenses') ? '#ffffff' : '#334155'
            }}
          >
            {text.out || 'OUT'}
          </button>
        </div>

        {/* Date and Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={triggerDatePicker}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition relative"
          >
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-slate-800 select-none">
              {formatDisplayDate(date) || (text.dateLabel || 'Pick Date')}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
            />
          </div>

          <div
            onClick={triggerTimePicker}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition relative"
          >
            <ClockIcon className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-slate-800 select-none">
              {formatDisplayTime(time) || (text.timeLabel || 'Pick Time')}
            </span>
            <input
              ref={timeInputRef}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-none"
            />
          </div>
        </div>

        {/* Enter Amount Field with Preview on the Right */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {text.enterAmount || 'Enter Amount'}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl font-bold text-slate-800">
                {selectedCurrency?.symbol || '$'}
              </span>
              <input
                type="text"
                value={amountDisplayValue}
                onChange={(event) => {
                  setAmountExpression((currentExpression) =>
                    buildAmountExpression(currentExpression, event.target.value)
                  )
                }}
                placeholder="0"
                className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none placeholder:text-slate-300 pr-24"
              />
            </div>
            {previewAmount !== null && (
              <div className="text-sm font-semibold text-slate-400 absolute right-0 top-1/2 -translate-y-1/2">
                {formatMoney(previewAmount, selectedCurrency, locale)}
              </div>
            )}
          </div>
        </div>

        {/* Amount arithmetic sum tags display */}
        {tokens.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm font-light px-1">
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
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <span key={`${token}-${index}`} className="px-1 text-slate-400 font-semibold">
                  {token}
                </span>
              )
            )}
          </div>
        )}

        <div>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={text.notesPlaceholder || "Add a short note"}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-300 placeholder:text-slate-400 transition"
          />
        </div>

        {/* Payment Mode and Add Bills in a single row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <select
              value={paymentMode || ""}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-300 transition cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23CBCCD4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat"
            >
              <option value="" disabled hidden>{text.paymentMode || 'Payment Mode'}</option>
              <option value="online">{text.online || 'Online'}</option>
              <option value="cash">{text.cash || 'Cash'}</option>
            </select>
          </div>

          <div>
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50 transition h-full">
              <span className="inline-flex items-center gap-2 text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                <PaperClipIcon className="h-5 w-5 text-primary-600" />
                {attachment?.name || existingAttachmentName || (text.addBills || 'Add bills...')}
              </span>
              {(attachment || existingAttachmentName) ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setAttachment(null)
                  }}
                  className="rounded-full p-1 hover:bg-slate-100 text-slate-400"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              ) : (
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
              )}
            </label>
          </div>
        </div>

        {/* Error / Success Display Messages */}
        {error && <p className="text-xs text-rose-600 font-semibold px-1">{error}</p>}
        {savedMessage && <p className="text-xs text-emerald-600 font-semibold px-1">{savedMessage}</p>}

        {/* Action Buttons */}
        <div className="pt-2">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canSave || isSaving}
              onClick={() => onSave(false)}
              className={`flex-1 py-3.5 text-center text-sm font-bold rounded-2xl transition disabled:opacity-50 ${
                isEditMode
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25 border border-primary-600'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaving === 'save' || isSaving === true ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {text.saving || 'Saving'}...
                </span>
              ) : (
                text.save || 'Save'
              )}
            </button>
            {!isEditMode && (
              <button
                type="button"
                disabled={!canSave || isSaving}
                onClick={() => onSaveAndAddAnother(true)}
                className="flex-1 py-3.5 text-center text-sm font-bold rounded-2xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 transition"
              >
                {isSaving === 'saveAndAdd' ? (
                  <span className="flex items-center justify-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    {text.saving || 'Saving'}...
                  </span>
                ) : (
                  text.saveAndAddAnother || 'Save & Add'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
