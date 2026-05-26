// Repo file header
import { motion } from 'framer-motion'
import { ArrowRightIcon, BuildingOffice2Icon, Squares2X2Icon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'

export default function HowItWorks(){
  const steps = [
    {title:'Create Organization', desc:'Spin up a workspace for a company or client.', icon: BuildingOffice2Icon},
    {title:'Customize Modules', desc:'Define revenue, expense, and investment modules.', icon: Squares2X2Icon},
    {title:'Track Transactions', desc:'Record and review finances with confidence.', icon: ArrowsRightLeftIcon}
  ]

  return (
    <section className="mt-16 scroll-mt-28">
      <div className="max-w-2xl">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">How it works</p>
        <h3 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">A simple three-step workflow</h3>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {steps.map((s,i)=> (
          <motion.article key={s.title} initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{ once:true, amount:0.35 }} transition={{delay:0.08*i, duration:0.45}} className="card-floating relative rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 text-primary-400">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-light text-white">0{i + 1}</span>
            </div>
            <div className="mt-5 flex items-center gap-3 text-white/30">
              {Array.from({ length: i < 2 ? 2 : 0 }).map((_, idx) => <span key={idx} className="h-px flex-1 bg-primary-100" />)}
            </div>
            <h4 className="mt-5 text-xl font-light text-[var(--text)]">{s.title}</h4>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{s.desc}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-light text-white/85">
              Learn more <ArrowRightIcon className="h-4 w-4" />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
