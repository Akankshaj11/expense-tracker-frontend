// Repo file header
import { apiRequest } from './api'

// Function: readJSON
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Read cached organizations from storage
// Function: readCachedOrganizations
export function readCachedOrganizations() {
  const organizations = readJSON('organizations', [])
  if (organizations.length > 0) {
    return organizations
  }

  const organization = readJSON('organization', null)
  return organization ? [{ ...organization, id: organization.id || Date.now().toString() }] : []
}

// Function: getStoredCurrentUser
export function getStoredCurrentUser() {
  return readJSON('currentUser', null)
}

// Load organizations from backend API
export async function loadOrganizationsFromBackend() {
  // const currentUser = getStoredCurrentUser()
  // const ownerId = currentUser?.id || currentUser?._id || currentUser?.email || ''
  // if (!ownerId) {
  //   return readCachedOrganizations()
  // }

  try {
    // const response = await apiRequest(`/organizations?ownerId=${encodeURIComponent(ownerId)}`)
    const response = await apiRequest('/organizations')
    const organizations = Array.isArray(response?.data?.items) ? response.data.items : []

    if (organizations.length > 0) {
      localStorage.setItem('organizations', JSON.stringify(organizations))
      localStorage.setItem('organization', JSON.stringify(organizations[0]))

      const currentUser = readJSON('currentUser', null)
      const userKey = currentUser ? `activeOrgId_${currentUser.email || currentUser.id}` : null
      const storedActiveId = userKey ? (localStorage.getItem(userKey) || localStorage.getItem('activeOrgId')) : localStorage.getItem('activeOrgId')

      if (!storedActiveId || !organizations.some((organization) => organization.id === storedActiveId)) {
        const nextActiveId = organizations[0].id
        localStorage.setItem('activeOrgId', nextActiveId)
        if (userKey) {
          localStorage.setItem(userKey, nextActiveId)
        }
      } else {
        localStorage.setItem('activeOrgId', storedActiveId)
        if (userKey) {
          localStorage.setItem(userKey, storedActiveId)
        }
      }
    }

    return organizations.length > 0 ? organizations : readCachedOrganizations()
  } catch {
    return readCachedOrganizations()
  }
}

// Load transactions from backend API for a specific organization
export async function loadTransactionsFromBackend(organizationId) {
  if (!organizationId) {
    return []
  }

  try {
    const response = await apiRequest(`/transactions?organizationId=${encodeURIComponent(organizationId)}`)
    const transactions = Array.isArray(response?.data?.items) ? response.data.items : []

    const localTxns = readJSON('transactions', [])
    const otherOrgTxns = localTxns.filter((txn) => txn.organizationId !== organizationId)
    const updatedTxns = [...transactions, ...otherOrgTxns]

    localStorage.setItem('transactions', JSON.stringify(updatedTxns))

    try {
      window.dispatchEvent(new Event('transactions:updated'))
    } catch {
      // ignore
    }

    return transactions
  } catch {
    return readJSON('transactions', []).filter((txn) => txn.organizationId === organizationId)
  }
}