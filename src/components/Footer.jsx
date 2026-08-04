// Repo file header
import { Link } from 'react-router-dom'

export default function Footer() {
  const currentUserStr = localStorage.getItem('currentUser')
  let isAdmin = false
  if (currentUserStr) {
    try {
      const user = JSON.parse(currentUserStr)
      isAdmin = user.role === 'super_admin' || user.role === 'admin'
    } catch (e) {}
  }

  return (
    <footer className="bg-primary-600 text-white">
      <div className="container-max mx-auto px-4 py-4 text-center text-sm flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © {new Date().getFullYear()} Softtrades Technology. All rights reserved.
        </div>
        {isAdmin && (
          <div className="flex items-center gap-4 text-xs">
            <Link to="/admin" className="text-white/80 hover:text-white hover:underline transition">
              Admin Panel
            </Link>
          </div>
        )}
      </div>
    </footer>
  )
}
