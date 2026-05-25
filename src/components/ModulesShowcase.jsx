import { motion } from 'framer-motion'
import { ChevronRightIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

const nodes = [
  { title: 'Projects', children: ['Website revamp', 'Q2 campaign'] },
  { title: 'Operations', children: ['Office supplies', 'Travel'] },
  { title: 'Investments', children: ['Index funds'] },
]

export default function ModulesShowcase(){
  return (
    <section id="modules" className="mt-16 scroll-mt-28">
      <div className="max-w-2xl">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Structure</p>
        <h3 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">Shape your finance structure with modules and categories</h3>
        <p className="prose-justified mt-4 text-base">Organize work into modules while tracking revenue and expenses as separate categories. The system models modules and categories independently so reporting stays flexible.</p>
      </div>

      <motion.div initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{ once:true, amount:0.35 }} transition={{duration:0.55}} className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="card-floating rounded-[1.75rem] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
                <Squares2X2Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-light text-[var(--muted)]">Organization</p>
                <h4 className="text-2xl font-light text-[var(--text)]">Acme Finance</h4>
              </div>
            </div>
            <button className="rounded-full border border-primary-100 bg-white/6 px-4 py-2 text-sm font-light text-white transition hover:-translate-y-0.5 hover:shadow-md">
              Edit structure
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {nodes.map((node, index) => (
              <div key={node.title} className={`rounded-[1.5rem] border border-white/6 bg-white/4 p-4 shadow-sm`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-light text-[var(--text)]">{node.title}</p>
                    <p className="text-sm text-[var(--muted)]">{node.children.length} submodules · example activity</p>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-[var(--muted)]" />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {node.children.map((child, i) => {
                    const gradients = [
                      ['#0ea5a4', '#06b6d4'],
                      ['#0f4aa6', '#0b3a84'],
                      ['#d4af37', '#c9a227'],
                      ['#111827', '#0F172A'],
                    ]
                    const g = gradients[i % gradients.length]
                    return (
                      <div key={child} className="rounded-full border border-primary-100 px-4 py-2 text-sm font-light text-white shadow-sm" style={{background:`linear-gradient(90deg, ${g[0]}, ${g[1]})`}}>
                        {child}
                      </div>
                    )
                  })}
                </div>

                <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.05 }} className="mt-4 h-1 origin-left rounded-full bg-primary-100">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card-floating rounded-[1.75rem] p-5 sm:p-6">
            <p className="text-sm font-light uppercase tracking-[0.18em] text-primary-600">Module insights</p>
            <p className="mt-3 text-xl font-light text-[var(--text)]">Composable finance workflows</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Drag-ready hierarchy, clean submodule layout, and a visual system that can expand to support permissions, budgets, and ownership levels.</p>
          </div>

          <div className="card-floating rounded-[1.75rem] p-5 sm:p-6">
            <p className="text-sm font-light uppercase tracking-[0.18em] text-primary-600">Recent module activity</p>
            <div className="mt-4 space-y-3">
              {['Salary module updated', 'Food expenses grouped', 'Stock allocation created'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/4 px-4 py-3 shadow-sm">
                  <span className="text-sm font-light text-[var(--text)]">{item}</span>
                  <span className="text-xs font-light text-primary-400">Synced</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
