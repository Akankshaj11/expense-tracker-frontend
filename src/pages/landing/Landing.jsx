// Repo file header
import Navbar from '../../components/landing/Navbar'
import Hero from '../../components/landing/Hero'
import Stats from '../../components/landing/Stats'
import About from '../../components/landing/About'
import Features from '../../components/landing/Features'
import Ratings from '../../components/landing/Ratings'
import FAQ from '../../components/landing/FAQ'
import CTA from '../../components/landing/CTA'
import FooterFull from '../../components/landing/FooterFull'
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
          <Stats />
          <About />
          <Features />
          <Ratings />
          <FAQ />
          <CTA />
        </section>
      </main>

      <FooterFull />
    </div>
  )
}

