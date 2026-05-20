import { apiRequest, getStoredAccessToken } from './api'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function readCachedOrganizations() {
  const organizations = readJSON('organizations', [])
  if (organizations.length > 0) {
    return organizations
  }

  const organization = readJSON('organization', null)
  return organization ? [{ ...organization, id: organization.id || Date.now().toString() }] : []
}

export function getStoredCurrentUser() {
  return readJSON('currentUser', null)
}

export async function loadOrganizationsFromBackend() {
  const currentUser = getStoredCurrentUser()
  const ownerId = currentUser?.id || currentUser?._id || currentUser?.email || ''
  const accessToken = getStoredAccessToken()

  if (!ownerId || !accessToken) {
    return readCachedOrganizations()
  }

  try {
    const response = await apiRequest(`/organizations?ownerId=${encodeURIComponent(ownerId)}`)
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