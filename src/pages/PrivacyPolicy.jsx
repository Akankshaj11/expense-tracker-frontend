import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div className="theme-light-violet min-h-screen px-4 py-12 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="container-max mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-[var(--card)] p-6 shadow-glass sm:p-8 lg:p-10">
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            ← Back
          </button>
        </div>
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Legal</p>
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          This policy explains how FinTrack handles your information. We collect the data you enter to provide account, organization, and reporting features.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[var(--text)]">
          <section>
            <h2 className="text-lg font-medium">Information we use</h2>
            <p className="mt-2 text-[var(--muted)]">
              We use profile, organization, transaction, and attachment data to power the app experience and generate reports.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium">How we use it</h2>
            <p className="mt-2 text-[var(--muted)]">
              Your data helps us save your workspace, show analytics, and keep your records organized across devices.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Your choices</h2>
            <p className="mt-2 text-[var(--muted)]">
              You can review, update, or delete information through the app where available. If you need help, contact your administrator or support team.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}