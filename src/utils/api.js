const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL.replace(/\/$/, '')
}

export function getStoredAccessToken() {
  const currentUser = readJSON('currentUser', null)
  return localStorage.getItem('accessToken') || localStorage.getItem('authToken') || currentUser?.access_token || ''
}

export async function apiRequest(path, options = {}) {
  const accessToken = getStoredAccessToken()
  const response = await fetch(`${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  })

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