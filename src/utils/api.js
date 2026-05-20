const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
// Frontend always calls the backend API. To disable network calls explicitly,
// set `VITE_NO_BACKEND=1` in your env (not recommended for permanent use).
const NO_BACKEND = false
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register']

let sessionExpiredNotified = false

// Helpful debug trace when running locally
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  // eslint-disable-next-line no-console
  console.info('[api] NO_BACKEND=', NO_BACKEND)
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

function isJwtExpired(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) {
    return false
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    if (!payload?.exp) {
      return false
    }

    return Date.now() >= Number(payload.exp) * 1000
  } catch {
    return false
  }
}

function clearStoredAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
}

function notifySessionExpired() {
  if (sessionExpiredNotified || typeof window === 'undefined') {
    return
  }

  sessionExpiredNotified = true
  window.dispatchEvent(
    new CustomEvent('auth:session-expired', {
      detail: { message: 'Your session has expired. Please login again.' },
    }),
  )
}

function isPublicAuthPath(path) {
  return PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath))
}

export function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL.replace(/\/$/, '')
}

export function getStoredAccessToken() {
  const currentUser = readJSON('currentUser', null)
  const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('authToken') || currentUser?.access_token || ''

  if (accessToken && isJwtExpired(accessToken)) {
    clearStoredAuth()
    notifySessionExpired()
    return ''
  }

  return accessToken
}

export async function authenticatedFetch(path, options = {}) {
  const accessToken = getStoredAccessToken()
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  if (!accessToken && !isPublicAuthPath(cleanPath) && sessionExpiredNotified) {
    sessionExpiredNotified = false
    throw new Error('Your session has expired. Please login again.')
  }

  const response = await fetch(`${getApiBaseUrl()}${cleanPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (response.status === 401 && !isPublicAuthPath(cleanPath)) {
    clearStoredAuth()
    notifySessionExpired()
    sessionExpiredNotified = false
  }

  return response
}

export async function apiRequest(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const response = await authenticatedFetch(cleanPath, options)

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed')
  }

  return payload
}