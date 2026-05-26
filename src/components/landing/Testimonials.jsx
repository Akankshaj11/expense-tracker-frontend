import { motion } from 'framer-motion'

export default function Testimonials(){
  const items = [
    {name:'Alex P.', role:'Founder', quote:'This app made our finance workflow feel calm, organized, and premium.'},
    {name:'Sam K.', role:'CFO', quote:'The dashboard feels investor-ready without sacrificing simplicity.'},
    {name:'Nina R.', role:'Operations Lead', quote:'We can track organization-level finances without the interface getting noisy.'}
  ]

  return (
    <section className="mt-16 scroll-mt-28">
      <div className="max-w-2xl">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">Testimonials</p>
        <h3 className="mt-3 text-3xl font-light tracking-tight text-[var(--text)] sm:text-4xl">Loved by teams that need clarity</h3>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {items.map((item, index)=> (
          <motion.article key={item.name} initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{ once:true, amount:0.35 }} transition={{delay:0.08*index, duration:0.45}} className="card-floating rounded-[1.75rem] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-light">
                {item.name.split(' ').map((part) => part[0]).join('')}
              </div>
              <div>
                <p className="font-light text-[var(--text)]">{item.name}</p>
                <p className="text-sm text-[var(--muted)]">{item.role}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">“{item.quote}”</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
