export default function DashboardEmptyState({ text, onCreateOrganization }) {
  return (
    <section className="mt-8 rounded-[2rem] border border-white/6 bg-[var(--card)] p-8 text-center shadow-sm">
      <p className="text-sm font-light uppercase tracking-[0.22em] text-slate-500">{text.noOrganizationYet}</p>
      <h2 className="mt-3 text-2xl font-light text-[var(--text)]">{text.createFirstOrganizationTitle}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
        {text.createFirstOrganizationDescription}
      </p>
      <button
        type="button"
        onClick={onCreateOrganization}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
      >
        {text.createOrganization}
      </button>
    </section>
  )
}