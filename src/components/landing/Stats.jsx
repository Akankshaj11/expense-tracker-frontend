// Repo file header
import { motion } from 'framer-motion'
import { ChartBarIcon, CubeIcon, GlobeAltIcon, SparklesIcon } from '@heroicons/react/24/outline'

const stats = [
  { 
    label: 'Transactions Managed', 
    value: '10K+', 
    icon: SparklesIcon,
    sparkline: [24, 30, 28, 45, 38, 55, 68],
    color: 'from-emerald-400 to-teal-500'
  },
  { 
    label: 'Custom Modules', 
    value: '50+', 
    icon: CubeIcon,
    sparkline: [12, 18, 22, 19, 32, 28, 42],
    color: 'from-primary-400 to-indigo-500'
  },
  { 
    label: 'Active Organizations', 
    value: '1.2K', 
    icon: GlobeAltIcon,
    sparkline: [8, 14, 25, 34, 40, 52, 60],
    color: 'from-cyan-400 to-blue-500'
  },
  { 
    label: 'Real-Time Insights', 
    value: 'Live', 
    icon: ChartBarIcon,
    sparkline: [45, 52, 48, 62, 58, 70, 85],
    color: 'from-amber-400 to-orange-500',
    isLive: true
  },
]

export default function Stats(){
  return (
    <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 w-full">
      {stats.map((s, i) => (
        <motion.div 
          key={s.label} 
          initial={{ opacity: 0, y: 15 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, amount: 0.2 }} 
          transition={{ delay: 0.08 * i, duration: 0.4 }} 
          className="glass-card rounded-[2rem] p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300"
        >
          {/* Subtle background glow */}
          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary-500/5 blur-xl group-hover:bg-primary-500/10 transition-all duration-500" />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold tracking-tight text-white">{s.value}</p>
                {s.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] font-light tracking-wide">{s.label}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 text-primary-400 transition-colors group-hover:bg-primary-500/10">
              <s.icon className="h-5 w-5" />
            </div>
          </div>
          
        </motion.div>
      ))}
    </section>
  )
}

