import { motion } from 'framer-motion'
import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  PresentationChartBarIcon,
  Square3Stack3DIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

const features = [
  {title:'Organization Management', desc:'Create and switch between organizations with clean permissions.', icon: BanknotesIcon},
  {title:'Custom Modules & Submodules', desc:'Shape revenue, expense, and investment hierarchies your way.', icon: Square3Stack3DIcon},
  {title:'Multi-Currency Support', desc:'Operate across regions with intuitive currency handling.', icon: CurrencyDollarIcon},
  {title:'Smart Expense Tracking', desc:'Track recurring spend and identify patterns fast.', icon: PresentationChartBarIcon},
  {title:'Quick Transactions', desc:'Enter income and spend in a couple of taps.', icon: CreditCardIcon},
  {title:'Attach Bills & Receipts', desc:'Keep proof and attachments on every record.', icon: DocumentArrowUpIcon},
  {title:'Analytics Dashboard', desc:'Clean graphs and summaries ready for real reporting.', icon: ClipboardDocumentListIcon},
  {title:'Recent Activity Tracking', desc:'Stay current with a live feed of every change.', icon: ClockIcon},
]

function Card({f}){
  return (
    <motion.article whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className="card-floating rounded-2xl p-5 transition-shadow hover:shadow-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-sm">
        <f.icon className="h-6 w-6" />
      </div>
      <h4 className="mt-4 text-lg font-semibold text-[var(--text)]">{f.title}</h4>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{f.desc}</p>
    </motion.article>
  )
}

export default function Features(){
  return (
    <section id="features" className="mt-16 scroll-mt-28">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-600">Features</p>
        <h3 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Built for a premium finance workflow</h3>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">A clean product surface that feels like a polished Wallet-style app, with productivity-friendly structure and analytics-ready depth.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {features.map(f=> <Card key={f.title} f={f} />)}
      </div>
    </section>
  )
}
