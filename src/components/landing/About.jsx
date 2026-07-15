// Repo file header
import { motion } from 'framer-motion'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

const bulletPoints = [
  'Isolate organizational settings from transactional modules.',
  'Create custom module hierarchies for any project or team.',
  'Verify records with receipts, notes, and multi-currency inputs.',
  'Generate print-ready PDF summaries and CSV reports in one click.'
]

export default function About(){
  return (
    <section id="about" className="mt-20 scroll-mt-28 w-full">
      <div className="grid gap-12 lg:grid-cols-12 items-center">
        
        {/* Left Side: Mock Dashboard Widget Panel */}
        <div className="lg:col-span-6 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300"
          >
            {/* Soft decorative background glows */}
            <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-cyan-500/5 blur-3xl" />
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary-500/5 blur-3xl" />
            
            {/* Header / Workspace select simulation */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">softtrades_workspace</span>
              </div>
              <span className="text-[10px] text-zinc-500 bg-white/5 px-2.5 py-1 rounded-full">Base Currency: USD</span>
            </div>

            {/* Total Balance & In/Out Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/4 p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-light">Total Balance</p>
                <p className="text-lg font-bold text-white mt-0.5">$12,482.00</p>
                <span className="text-[8px] text-emerald-400 font-light mt-0.5 inline-block">
                  ↑ +8.2%
                </span>
              </div>
              
              <div className="rounded-xl bg-white/4 p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-light">Total Inflow</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">+$15,800.00</p>
                <span className="text-[8px] text-zinc-500 font-light mt-0.5 inline-block">
                  This month
                </span>
              </div>

              <div className="rounded-xl bg-white/4 p-3 border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-zinc-400 font-light">Total Outflow</p>
                <p className="text-lg font-bold text-rose-400 mt-0.5">-$3,318.00</p>
                <span className="text-[8px] text-zinc-500 font-light mt-0.5 inline-block">
                  This month
                </span>
              </div>
            </div>

            {/* Simulated Transaction Log Feed */}
            <div className="mt-5 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium px-1">Recent Transactions</p>
              
              {[
                { name: 'Stripe Payout', desc: 'Inbound Revenue', amount: '+$4,500.00', color: 'text-emerald-400', time: '10 mins ago' },
                { name: 'Vercel Web Hosting', desc: 'Infrastructure Ops', amount: '-$40.00', color: 'text-zinc-300', time: '2 hours ago' },
                { name: 'Google Workspace', desc: 'Team Email License', amount: '-$120.00', color: 'text-zinc-300', time: '1 day ago' }
              ].map((txn, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.35 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/5 hover:bg-white/6 transition-colors"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-white">{txn.name}</h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{txn.desc} · {txn.time}</p>
                  </div>
                  <span className={`text-xs font-bold ${txn.color}`}>{txn.amount}</span>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </div>

        {/* Right Side: Copywriting Content */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          <div>
            <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Overview</p>
            <h3 className="mt-2 text-2xl font-light tracking-wide text-white sm:text-3xl">
              About PocketFlow
            </h3>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base leading-6">
              PocketFlow is a premium finance workspace engineered specifically for teams and organizations. 
              We separate system-level workspaces from transaction categories, giving you the freedom to 
              shape custom workflows, collaborate with permission layers, and export audit-ready summaries instantly.
            </p>
          </div>

          <div className="space-y-3">
            {bulletPoints.map((point, index) => (
              <motion.div 
                key={point} 
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <CheckCircleIcon className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-300 leading-6">{point}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

