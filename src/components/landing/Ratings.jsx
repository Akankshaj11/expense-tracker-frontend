// Repo file header
import { motion } from 'framer-motion'
import { StarIcon } from '@heroicons/react/24/solid'

const reviews = [
  {
    name: 'Sophia L.',
    role: 'Head of Finance at GlobeScale',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80',
    quote: 'The multi-currency tracking is incredibly smooth. We manage three regional offices and consolidate everything at the end of the month in minutes.'
  },
  {
    name: 'Daniel M.',
    role: 'CTO at Apex Digital',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80',
    quote: 'Perfect balance between custom settings and simplicity. The multi-organization switching is blazing fast and the interface is incredibly intuitive.'
  },
  {
    name: 'Emily T.',
    role: 'Operations Director at Vercel Labs',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80',
    quote: 'No more lost receipts or noisy Slack channels. PocketFlow gathers all workspace expenses in one clean, audit-ready, and beautiful dashboard.'
  }
]

export default function Ratings() {
  return (
    <section id="ratings" className="mt-20 scroll-mt-28 w-full">
      <div className="max-w-3xl">
        <p className="text-xs font-light uppercase tracking-[0.22em] text-primary-600">Ratings & Trust</p>
        <h4 className="mt-2 text-xl font-light text-white sm:text-2xl">
          Highly rated by finance teams
        </h4>
        <p className="mt-3 text-xs sm:text-sm text-[var(--muted)]">
          PocketFlow is built to be robust, secure, and intuitive. Read reviews from some of the fast-growing companies using PocketFlow.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3 w-full">
        {reviews.map((item, index)=> (
          <motion.article 
            key={item.name} 
            initial={{ opacity: 0, y: 15 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, amount: 0.2 }} 
            transition={{ delay: index * 0.15, duration: 0.5 }} 
            whileHover={{ y: -8, scale: 1.025 }}
            className="glass-card rounded-xl p-6 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} className="h-3.5 w-3.5 text-amber-400" />
                ))}
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-zinc-300 font-light font-sans">
                “{item.quote}”
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-5 border-t border-white/5 pt-3">
              <img 
                src={item.avatar} 
                alt={item.name} 
                className="h-8 w-8 rounded-full object-cover border border-white/10"
              />
              <div>
                <p className="text-[11px] font-semibold text-white">{item.name}</p>
                <p className="text-[9px] text-[var(--muted)]">{item.role}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
