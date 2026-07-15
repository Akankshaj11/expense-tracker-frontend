// Repo file header
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

export default function FooterFull() {
  return (
    <footer className="bg-primary-600 text-white">
      <div className="container-max mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="PocketFlow Logo" className="h-12 w-12 object-contain bg-white/10 p-1 rounded-full" />
              <div>
                <div className="text-lg font-bold">PocketFlow</div>
                <div className="text-sm text-white/90">Expert finance workspace for teams</div>
              </div>
            </div>

            <p className="text-sm text-white/90">Collaborate, attach receipts, and export print-ready reports.</p>

            {/* Social links removed per request */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to={'/#top'} className="hover:underline text-white/80 hover:text-white">Home</Link></li>
              <li><Link to={'/#about'} className="hover:underline text-white/80 hover:text-white">About</Link></li>
              <li><Link to={'/#features'} className="hover:underline text-white/80 hover:text-white">Features</Link></li>
              <li><Link to={'/#ratings'} className="hover:underline text-white/80 hover:text-white">Ratings</Link></li>
              <li><Link to={'/#faq'} className="hover:underline text-white/80 hover:text-white">FAQ</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><Link to={'/terms'} className="hover:underline">Terms of Service</Link></li>
              <li><Link to={'/privacy'} className="hover:underline">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6 text-center text-white text-sm">
          <div>© {new Date().getFullYear()} PocketFlow. All rights reserved.</div>
          <div className="mt-2">Designed by : Softtrades Technology Pvt. Ltd.</div>
        </div>
      </div>
    </footer>
  )
}
