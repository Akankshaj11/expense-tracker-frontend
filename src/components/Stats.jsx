import { motion } from 'framer-motion'
import { ChartBarIcon, CubeIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline'

const stats = [
  { label: 'Transactions Managed', value: '10K+', icon: SparklesIcon },
  { label: 'Custom Modules', value: '50+', icon: CubeIcon },
  { label: 'Organizations', value: '1.2K', icon: GlobeAltIcon },
  { label: 'Real-Time Insights', value: 'Live', icon: ChartBarIcon },
]

export default function Stats(){
  return (
    <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s,i)=>(
        <motion.div key={s.label} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{ once:true, amount:0.4 }} transition={{delay:0.06*i}} className="card-floating group rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-[var(--text)]">{s.value}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{s.label}</p>
            </div>
            <div className="rounded-2xl bg-primary-50 p-3 text-primary-600 transition group-hover:bg-primary-500 group-hover:text-white">
              <s.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-100">
            <motion.div initial={{width:0}} whileInView={{width:'68%'}} viewport={{ once:true }} transition={{delay:0.2 + i*0.05, duration:0.8}} className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
          </div>
        </motion.div>
      ))}
    </section>
  )
}
