// Repo file header
import { useNavigate } from 'react-router-dom'

export default function TermsOfService() {
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
        <h1 className="mt-3 text-3xl font-light tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          These terms describe how you may use PocketFlow. By using the app, you agree to provide accurate information, keep your account secure, and use the service in a lawful manner.
        </p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[var(--text)]">
          <section>
            <h2 className="text-lg font-medium">Use of service</h2>
            <p className="mt-2 text-[var(--muted)]">
              PocketFlow is provided to help you track expenses, manage organizations, and export reports. You are responsible for the content you add and for any activity under your account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Accounts</h2>
            <p className="mt-2 text-[var(--muted)]">
              Keep your login credentials confidential. Notify us if you believe your account has been compromised.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-medium">Updates</h2>
            <p className="mt-2 text-[var(--muted)]">
              We may update these terms from time to time. Continued use of PocketFlow after changes means you accept the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}