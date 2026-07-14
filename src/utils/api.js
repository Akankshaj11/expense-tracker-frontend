// Repo file header
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
// Frontend always calls the backend API. To disable network calls explicitly,
// set `VITE_NO_BACKEND=1` in your env (not recommended for permanent use).
const NO_BACKEND = false
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register']
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

let sessionExpiredNotified = false

// Helpful debug trace when running locally
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  // eslint-disable-next-line no-console
  console.info('[api] NO_BACKEND=', NO_BACKEND)
}

// Function: readJSON
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Function: getJwtExpirySeconds
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

// Function: base64UrlDecode
function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

// Function: isJwtExpired
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

// Function: clearStoredAuth
export function clearStoredAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
}

// Function: notifySessionExpired
function notifySessionExpired() {
  if (sessionExpiredNotified || typeof window === 'undefined') {
    return
  }

  sessionExpiredNotified = true
  clearStoredAuth()
  window.dispatchEvent(
    new CustomEvent('auth:session-expired', {
      detail: { message: 'Your session has expired. Please login again.' },
    }),
  )
}

// Function: isPublicAuthPath
function isPublicAuthPath(path) {
  return PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath))
}

// Function: getApiBaseUrl
export function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL.replace(/\/$/, '')
}

// Keep compatibility helpers for the rest of the app.
// Function: getStoredAccessToken
export function getStoredAccessToken() {
  if (typeof localStorage === 'undefined') {
    return ''
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('authToken') || ''
}

// Function: setStoredAccessToken
export function setStoredAccessToken(token) {
  if (typeof localStorage === 'undefined') {
    return
  }

  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    localStorage.setItem('authToken', token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem('authToken')
  }
}

// Function: getStoredRefreshToken
export function getStoredRefreshToken() {
  if (typeof localStorage === 'undefined') {
    return ''
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

// Function: setStoredRefreshToken
export function setStoredRefreshToken(token) {
  if (typeof localStorage === 'undefined') {
    return
  }

  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

let activeRequestsCount = 0

function incrementLoading() {
  if (typeof window !== 'undefined') {
    activeRequestsCount += 1
    if (activeRequestsCount === 1) {
      window.dispatchEvent(new CustomEvent('api:loading', { detail: { loading: true } }))
    }
  }
}

function decrementLoading() {
  if (typeof window !== 'undefined') {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1)
    if (activeRequestsCount === 0) {
      window.dispatchEvent(new CustomEvent('api:loading', { detail: { loading: false } }))
    }
  }
}

// Perform authenticated fetch (bearer headers)
export async function authenticatedFetch(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const accessToken = getStoredAccessToken()
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (accessToken && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
  }

  incrementLoading()
  try {
    const response = await fetch(`${getApiBaseUrl()}${cleanPath}`, {
      ...options,
      headers: requestHeaders,
    })

    if (response.status === 401) {
      // Do NOT refresh for login/register routes
      if (isPublicAuthPath(cleanPath)) {
        return response
      }

      const refreshToken = getStoredRefreshToken()
      if (!refreshToken) {
        notifySessionExpired()
        sessionExpiredNotified = false
        return response
      }

      try {
        // Attempt silent refresh
        const refreshResponse = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
        })

        const refreshPayload = await refreshResponse.json().catch(() => null)
        const newAccessToken = refreshPayload?.data?.accessToken || ''

        // Refresh successful → retry original request
        if (refreshResponse.ok && newAccessToken) {
          setStoredAccessToken(newAccessToken)
          return await authenticatedFetch(cleanPath, options)
        }

        // Refresh failed
        notifySessionExpired()
      } catch {
        notifySessionExpired()
      }

      sessionExpiredNotified = false
    }

    return response
  } finally {
    decrementLoading()
  }
}

// Wrapper for API requests
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