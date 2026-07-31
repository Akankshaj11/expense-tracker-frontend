// Repo file header
import { apiRequest } from './api'
import { loadOrganizationsFromBackend } from './organizationSync'
import { getPersistedCategoryTransactionType } from './categoryUtils'
import { normalizeCurrency } from './currencies'

export async function persistOrganizationCategories(activeOrganizationId, nextOrgs, setOrganizations) {
  setOrganizations(nextOrgs)
  try {
    localStorage.setItem('organizations', JSON.stringify(nextOrgs))
  } catch {
    // ignore
  }

  try {
    const active = nextOrgs.find((org) => org.id === activeOrganizationId)
    if (!active) {
      return
    }

    // Function: categoriesForBackend
    const categoriesForBackend = (active.categories || []).map((category) => ({
      name: category.name,
      direction: getPersistedCategoryTransactionType(category),
      isCustom: category?.isCustom === true,
      subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
    }))
    const subcategoriesMap = {}
    categoriesForBackend.forEach((category) => {
      subcategoriesMap[category.name] = Array.isArray(category.subcategories) ? category.subcategories : []
    })

    await apiRequest(`/organizations/${encodeURIComponent(activeOrganizationId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ categories: categoriesForBackend, subcategories: subcategoriesMap }),
    })

    const refreshed = await loadOrganizationsFromBackend()
    if (Array.isArray(refreshed) && refreshed.length > 0) {
      setOrganizations(refreshed)
    }
  } catch {
    // ignore
  }
}

export async function persistOrganizationCurrency(activeOrganizationId, nextCurrency, organizations, setOrganizations) {
  const normalizedCurrency = normalizeCurrency(nextCurrency)
  const nextOrgs = organizations.map((org) => (
    org.id === activeOrganizationId
      ? { ...org, currency: normalizedCurrency }
      : org
  ))

  setOrganizations(nextOrgs)

  try {
    localStorage.setItem('organizations', JSON.stringify(nextOrgs))
    const active = nextOrgs.find((org) => org.id === activeOrganizationId)
    if (active) {
      localStorage.setItem('organization', JSON.stringify(active))
    }
  } catch {
    // ignore
  }

  const isMongoId = /^[a-f0-9]{24}$/.test(activeOrganizationId)
  if (!isMongoId) {
    return
  }

  try {
    await apiRequest(`/organizations/${encodeURIComponent(activeOrganizationId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ currency: normalizedCurrency }),
    })

    const refreshed = await loadOrganizationsFromBackend()
    if (Array.isArray(refreshed) && refreshed.length > 0) {
      setOrganizations(refreshed)
    }
  } catch {
    // ignore
  }
}

// Function: appendCustomCategory
export function appendCustomCategory(organizations, activeOrganizationId, categoryName, direction = 'in') {
  const name = categoryName.trim()
  if (!name) {
    return organizations
  }

  return organizations.map((org) => {
    if (org.id !== activeOrganizationId) {
      return org
    }

    const nextCategories = Array.isArray(org.categories) ? [...org.categories] : []
    if (!nextCategories.find((category) => category.name === name)) {
      nextCategories.push({ name, subcategories: [], direction, transactionType: direction, categoryType: direction, isCustom: true })
    }

    return { ...org, categories: nextCategories }
  })
}

// Function: appendsubcategoryToCategory
export function appendsubcategoryToCategory(organizations, activeOrganizationId, categoryName, subcategoryName) {
  const name = subcategoryName.trim()
  if (!name) {
    return organizations
  }

  return organizations.map((org) => {
    if (org.id !== activeOrganizationId) {
      return org
    }

    // Function: nextCategories
    const nextCategories = (org.categories || []).map((category) => {
      if (category.name !== categoryName) {
        return category
      }

      const nextsubcategories = Array.isArray(category.subcategories) ? [...category.subcategories] : []
      if (!nextsubcategories.includes(name)) {
        nextsubcategories.push(name)
      }

      return { ...category, subcategories: nextsubcategories }
    })

    return { ...org, categories: nextCategories }
  })
}
