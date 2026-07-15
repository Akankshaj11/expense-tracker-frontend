// Repo file header
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Register PWA service worker
registerSW({ immediate: true })

// Clear hash on initial load/refresh so the hero page appears first
if (window.location.hash) {
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)