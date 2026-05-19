const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const NO_BACKEND = (
  (import.meta.env.VITE_NO_BACKEND === 'true' || import.meta.env.VITE_NO_BACKEND === '1') ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && import.meta.env.MODE === 'development')
)

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

export function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL.replace(/\/$/, '')
}

export function getStoredAccessToken() {
  const currentUser = readJSON('currentUser', null)
  return localStorage.getItem('accessToken') || localStorage.getItem('authToken') || currentUser?.access_token || ''
}

export async function apiRequest(path, options = {}) {
  if (NO_BACKEND) {
    // Frontend-only mode: mock a minimal subset of endpoints using localStorage to avoid network calls.
    await new Promise((r) => setTimeout(r, 120))
    const method = (options.method || 'GET').toUpperCase()
    // POST /transactions -> persist to localStorage and return a saved transaction
    if (path === '/transactions' && method === 'POST') {
      try {
        const payload = options.body ? JSON.parse(options.body) : {}
        const transactions = readJSON('transactions', [])
        const nextTransaction = {
          id: payload.id || Date.now().toString(),
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem('transactions', JSON.stringify([nextTransaction, ...transactions]))
        return { data: { transaction: nextTransaction } }
      } catch (err) {
        throw new Error('Invalid request body')
      }
    }

    // GET /transactions -> return local transactions
    if ((path === '/transactions' || path.startsWith('/transactions')) && method === 'GET') {
      const transactions = readJSON('transactions', [])
      return { data: { transactions } }
    }

    // Default mock response for other routes
    return { data: {} }
  }
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