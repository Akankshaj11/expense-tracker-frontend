const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
// Frontend always calls the backend API. To disable network calls explicitly,
// set `VITE_NO_BACKEND=1` in your env (not recommended for permanent use).
const NO_BACKEND = false
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register']
const ACCESS_TOKEN_COOKIE = 'accessToken'

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

function getCookie(name) {
  if (typeof document === 'undefined') {
    return ''
  }

  const encodedName = `${encodeURIComponent(name)}=`
  const cookies = document.cookie ? document.cookie.split('; ') : []

  for (const cookie of cookies) {
    if (cookie.startsWith(encodedName)) {
      return decodeURIComponent(cookie.slice(encodedName.length))
    }
  }

  return ''
}

function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') {
    return
  }

  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    'path=/',
    'SameSite=Lax',
  ]

  if (typeof maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`)
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure')
  }

  document.cookie = parts.join('; ')
}

function clearCookie(name) {
  setCookie(name, '', 0)
}

function getJwtExpirySeconds(token) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    if (!payload?.exp) {
      return null
    }

    const expiresAt = Number(payload.exp) * 1000
    if (!Number.isFinite(expiresAt)) {
      return null
    }

    return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
  } catch {
    return null
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

export function clearStoredAuth() {
  clearCookie(ACCESS_TOKEN_COOKIE)
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

// With server-managed HttpOnly cookies we don't expose tokens to JS.
// Keep compatibility functions but make them no-ops.
export function getStoredAccessToken() {
  return ''
}

export function setStoredAccessToken() {
  // no-op: tokens are set by the backend in HttpOnly cookies
}

export async function authenticatedFetch(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  const response = await fetch(`${getApiBaseUrl()}${cleanPath}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

 if (response.status === 401) {

  // Do NOT refresh for login/register routes
  if (isPublicAuthPath(cleanPath)) {
    return response
  }

  try {
    // Attempt silent refresh
    const refreshResponse = await fetch(
      `${getApiBaseUrl()}/auth/refresh`,
      {
        method: 'POST',
        credentials: 'include',
      },
    )

    // Refresh successful → retry original request
    if (refreshResponse.ok) {
      return authenticatedFetch(cleanPath, options)
    }

    // Refresh failed
    notifySessionExpired()

  } catch {
    notifySessionExpired()
  }

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