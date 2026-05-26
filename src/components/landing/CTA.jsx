import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function CTA(){
  return (
    <section id="pricing" className="mt-16 scroll-mt-28">
      <motion.div initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{ once:true, amount:0.35 }} transition={{duration:0.5}} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-6 py-14 text-white shadow-[0_20px_60px_rgba(61,191,108,0.24)] sm:px-10 sm:py-16">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-sm font-light uppercase tracking-[0.24em] text-white/75">Ready to start</p>
          <h3 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">Start Managing Your Finances Better Today</h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/80">A modern, premium finance experience designed to make your organization feel more structured, productive, and in control.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3.5 text-sm font-light text-white transition hover:-translate-y-0.5 hover:shadow-xl">
              Get Started Free
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a href="#analytics" className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-light text-white transition hover:-translate-y-0.5 hover:bg-white/12">
              Explore Dashboard
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
