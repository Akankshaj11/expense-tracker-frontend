import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import About from '../components/About'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import DashboardPreview from '../components/DashboardPreview'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import FooterFull from '../components/FooterFull'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function Landing(){
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        // small timeout to ensure element is mounted
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
    }
  }, [location])

  return (
    <div id="top" className="relative overflow-x-hidden bg-black text-white">
      <Navbar />

      <main>
        <Hero />

        <section className="container-max mx-auto px-4 pb-16 sm:px-6">
          <About />
          <Stats />
          <Features />
          {/* <HowItWorks /> */}
          <DashboardPreview />
          <Testimonials />
          <CTA />
        </section>
      </main>

      <FooterFull />
    </div>
  )
}
