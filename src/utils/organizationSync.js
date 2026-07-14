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

      const activeOrgId = localStorage.getItem('activeOrgId')
      if (!activeOrgId || !organizations.some((organization) => organization.id === activeOrgId)) {
        localStorage.setItem('activeOrgId', organizations[0].id)
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