import { BuildingOffice2Icon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { getCurrencyByCode } from '../../utils/currencies'

export default function DashboardWorkspaceSummary({ text, activeOrganization, activeCurrency, moduleCards, onDownloadReport }) {
  return (
    <div className="rounded-[2rem] border border-white/6 bg-[var(--card)] p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.workspace}</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight text-[var(--text)]">{text.currentSummary}</h2>
        </div>
        <div className="rounded-full bg-violet-50 p-3 text-violet-600">
          <BuildingOffice2Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-[1.5rem] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">{text.organization}</span>
          <span className="font-light text-[var(--text)]">{activeOrganization.organizationName}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">{text.currency}</span>
          <span className="font-light text-[var(--text)]">
            <span className="currency-symbol">{activeCurrency?.symbol || getCurrencyByCode(activeCurrency?.code || 'USD').symbol}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">{text.modules}</span>
          <span className="font-light text-[var(--text)]">{moduleCards.length}</span>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-light uppercase tracking-[0.22em] text-slate-500">{text.tip}</p>
            <p className="mt-2 text-lg font-light text-[var(--text)]">{text.tipMessage}</p>
          </div>
          <PlusIcon className="h-6 w-6 text-primary-600" />
        </div>
      </div>

      <div className="mt-4">
        <button type="button" onClick={onDownloadReport} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-light text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700">
          <ArrowDownTrayIcon className="h-4 w-4" />
          {text.downloadReport}
        </button>
      </div>
    </div>
  )
}