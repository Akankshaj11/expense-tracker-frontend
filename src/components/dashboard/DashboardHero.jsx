// Repo file header
import { BuildingOffice2Icon, PlusIcon } from '@heroicons/react/24/outline'
import { translateText } from '../../i18n/translations'

// Function: selectGreetingKeyByHour
function selectGreetingKeyByHour(hour) {
  if (hour >= 5 && hour < 12) return 'greetingMorning'
  if (hour >= 12 && hour < 17) return 'greetingAfternoon'
  if (hour >= 17 && hour < 21) return 'greetingEvening'
  return 'greetingNight'
}

export default function DashboardHero({ text, firstName, activeOrganization, language, onAddTransaction, onManageOrganization }) {
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 12
  const greetingKey = selectGreetingKeyByHour(hour)

  return (
    <section className="inner-card-accent rounded-[2rem] border border-white bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="min-h-[8.5rem] space-y-3">
          <p className="text-sm font-light uppercase tracking-[0.26em] text-primary-600">{text.dashboard}</p>
          <h1 className="text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">
            {translateText(language, greetingKey, { name: firstName })}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
            {translateText(language, 'viewingWorkspace', {
              org: activeOrganization?.organizationName || 'your workspace',
              desc: activeOrganization?.description ? ` · ${activeOrganization.description}` : '',
            })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onAddTransaction}
            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-full accent-cta px-5 py-3 text-sm font-light transition hover:-translate-y-0.5"
          >
            {text.addTransaction}
            <PlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onManageOrganization}
            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 rounded-full border border-white/6 bg-[var(--card)] px-5 py-3 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {text.manageOrganization}
            <BuildingOffice2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}