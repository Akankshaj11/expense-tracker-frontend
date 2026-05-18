import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Stats from '../components/Stats'
import About from '../components/About'
import Features from '../components/Features'
import ModulesShowcase from '../components/ModulesShowcase'
import HowItWorks from '../components/HowItWorks'
import DashboardPreview from '../components/DashboardPreview'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

export default function Landing(){
  return (
    <div id="top" className="relative overflow-x-hidden">
      <Navbar />

      <main>
        <Hero />

        <section className="container-max mx-auto px-4 pb-16 sm:px-6">
          <About />
          <Stats />
          <Features />
          <ModulesShowcase />
          {/* <HowItWorks /> */}
          <DashboardPreview />
          <Testimonials />
          <CTA />
        </section>
      </main>

      <Footer />
    </div>
  )
}
