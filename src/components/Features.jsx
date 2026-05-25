import { motion } from 'framer-motion'
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  PresentationChartBarIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline'

const features = [
  {title:'Manage Organizations', desc:'Create and switch between organizations with clean permissions.', icon: BanknotesIcon},
  {title:'Modules & Submodules', desc:'Shape revenue, expense, and investment hierarchies your way.', icon: Square3Stack3DIcon},
  {title:'Multi-Currency', desc:'Operate across regions with intuitive currency handling.', icon: CurrencyDollarIcon},
  {title:'Smart Expense Tracking', desc:'Track recurring spend and identify patterns fast.', icon: PresentationChartBarIcon},
  {title:'Attach Bills & Receipts', desc:'Keep proof and attachments on every record.', icon: DocumentArrowUpIcon},
  {title:'Download reports', desc:'Export transactions (PDF) for a module and date to share or archive.', icon: ArrowDownTrayIcon},
]

function Card({f}){
  return (
    <motion.article whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className="card-floating rounded-2xl p-5 transition-shadow hover:shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/6 text-primary-400 shadow-sm">
          <f.icon className="h-5 w-5" />
        </div>
        <h4 className="text-md font-thin text-[var(--text)] opacity-80" style={{ WebkitFontSmoothing: 'subpixel-antialiased' }}>{f.title}</h4>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{f.desc}</p>
    </motion.article>
  )
}

export default function Features(){
  return (
    <section id="features" className="mt-16 scroll-mt-28">
      <div className="max-w-3xl">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Features</p>
        <h4 className="mt-3 text-3xl font-light text-[var(--text)] sm:text-4xl">Built for modern expense management</h4>
        <p className="prose-justified mt-4 text-base">A clean and intuitive workspace designed to manage your daily expenses with ease & clarity.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(f=> <Card key={f.title} f={f} />)}
      </div>
    </section>
  )
}
