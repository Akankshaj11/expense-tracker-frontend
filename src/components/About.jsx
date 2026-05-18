import { motion } from 'framer-motion'

export default function About(){
  const cards = [
    {title:'Organize', desc:'Workspaces & modules', from:'#8B5CF6', to:'#6366F1'},
    {title:'Track', desc:'Attach receipts, notes', from:'#06B6D4', to:'#06B6D4'},
    {title:'Report', desc:'Export printable PDFs', from:'#FF4DA0', to:'#D946EF'},
    {title:'Analyze', desc:'Live insights & trends', from:'#7C3AED', to:'#4C1D95'},
  ]

  return (
    <section id="about" className="mt-16 scroll-mt-28">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="max-w-lg">
          <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">About</p>
          <h3 className="mt-3 text-3xl font-light tracking-wide text-[var(--text)] sm:text-4xl">About FinTrack</h3>
          <p className="prose-justified mt-4 text-base">FinTrack is a lightweight finance workspace for teams. It separates organization modules from accounting categories (revenue/expenses) so you can compose workflows, attach receipts, and export print-ready transaction reports. Built for clarity, collaboration, and simple reporting.</p>
        </div>

        <div className="relative h-56 overflow-hidden">
          <svg className="absolute inset-0 h-full w-full opacity-10" viewBox="0 0 800 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M0 100 C120 40 240 160 360 100 C480 40 600 160 720 100 C780 80 820 120 900 100" stroke="url(#g)" strokeWidth="2" fill="none" />
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Marquee track: duplicate cards so the loop is seamless */}
          <motion.div className="absolute left-0 top-0 flex h-full w-[200%] items-center" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}>
            {[...cards, ...cards].map((c, i) => (
              <div key={`${c.title}-${i}`} className="mx-4 flex-shrink-0">
                <motion.div className="glass-card rounded-2xl p-4 w-44 shadow-lg" animate={{ y: [0, i % 2 === 0 ? -22 : 22, 0] }} transition={{ duration: 3.6, repeat: Infinity, delay: (i % cards.length) * 0.15, ease: 'easeInOut' }} whileHover={{ scale: 1.03 }}>
                  <div className="h-12 w-12 rounded-xl" style={{ background:`linear-gradient(135deg, ${c.from}, ${c.to})` }} />
                  <h4 className="mt-3 text-sm font-light text-white">{c.title}</h4>
                  <p className="mt-1 text-xs text-[var(--muted)]">{c.desc}</p>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
