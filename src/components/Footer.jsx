import { EnvelopeIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function Footer(){
  return (
    <footer id="about" className="mt-16 border-t border-white/70 bg-white/70 py-10 backdrop-blur-xl">
      <div className="container-max mx-auto grid gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 font-bold text-white shadow-lg shadow-primary-500/20">FT</div>
            <div>
              <div className="text-lg font-semibold text-[var(--text)]">FinTrack</div>
              <div className="text-sm text-[var(--muted)]">Finance for modern teams</div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">A premium Wallet-inspired finance management experience built for organizations, analytics, and calm day-to-day money control.</p>
        </div>

        <div>
          <h6 className="font-semibold text-[var(--text)]">Quick links</h6>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            {['Features', 'Modules', 'Analytics', 'Pricing'].map((item) => <li key={item}><a href={`#${item.toLowerCase()}`} className="transition hover:text-primary-700">{item}</a></li>)}
          </ul>
        </div>

        <div>
          <h6 className="font-semibold text-[var(--text)]">Contact</h6>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-primary-600" /> support@fintrack.app</div>
            <div className="flex items-center gap-2"><GlobeAltIcon className="h-4 w-4 text-primary-600" /> privacy policy</div>
            <div className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-primary-600" /> secure by design</div>
          </div>
        </div>
      </div>

      <div className="container-max mx-auto mt-8 flex flex-col gap-3 border-t border-white/60 px-4 pt-6 text-sm text-[var(--muted)] sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} FinTrack. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="transition hover:text-primary-700">Privacy</a>
          <a href="#" className="transition hover:text-primary-700">Terms</a>
          <a href="#" className="transition hover:text-primary-700">Support</a>
        </div>
      </div>
    </footer>
  )
}
