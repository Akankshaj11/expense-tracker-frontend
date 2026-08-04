// Repo file header
import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// Override Storage prototype to strip large base64 profile pictures and avoid QuotaExceededError in localStorage
try {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;

  Storage.prototype.getItem = function (key) {
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage) {
      // Strip large base64 profile pictures and avoid QuotaExceededError
      if (key === 'organizations') {
        try {
          const orgs = JSON.parse(value);
          if (Array.isArray(orgs)) {
            const stripped = orgs.map(org => ({
              ...org,
              members: org.members?.map(m => {
                const { profile_pic, ...rest } = m;
                return rest;
              }) || [],
              ownerDetails: org.ownerDetails ? {
                ...org.ownerDetails,
                profile_pic: null
              } : null
            }));
            value = JSON.stringify(stripped);
          }
        } catch (e) {}
      } else if (key === 'organization') {
        try {
          const org = JSON.parse(value);
          if (org && typeof org === 'object') {
            const { ownerDetails, members, ...rest } = org;
            const stripped = {
              ...rest,
              members: members?.map(m => {
                const { profile_pic, ...restM } = m;
                return restM;
              }) || [],
              ownerDetails: ownerDetails ? {
                ...ownerDetails,
                profile_pic: null
              } : null
            };
            value = JSON.stringify(stripped);
          }
        } catch (e) {}
      }
    }
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    return originalRemoveItem.call(this, key);
  };

  Storage.prototype.clear = function () {
    return originalClear.call(this);
  };
} catch (err) {
  console.error('Failed to patch Storage.prototype:', err);
}

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