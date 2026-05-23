import { apiRequest } from './api'
import { loadOrganizationsFromBackend } from './organizationSync'
import { getPersistedModuleTransactionType } from './moduleUtils'

export async function persistOrganizationModules(activeOrganizationId, nextOrgs, setOrganizations) {
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

    const modulesForBackend = (active.modules || []).map((module) => ({
      name: module.name,
      transactionType: getPersistedModuleTransactionType(module),
      isCustom: module?.isCustom === true,
      submodules: Array.isArray(module.submodules) ? module.submodules : [],
    }))
    const submodulesMap = {}
    modulesForBackend.forEach((module) => {
      submodulesMap[module.name] = Array.isArray(module.submodules) ? module.submodules : []
    })

    await apiRequest(`/organizations/${encodeURIComponent(activeOrganizationId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ modules: modulesForBackend, submodules: submodulesMap }),
    })

    const refreshed = await loadOrganizationsFromBackend()
    if (Array.isArray(refreshed) && refreshed.length > 0) {
      setOrganizations(refreshed)
    }
  } catch {
    // ignore
  }
}

export function appendCustomModule(organizations, activeOrganizationId, moduleName, transactionType = 'custom') {
  const name = moduleName.trim()
  if (!name) {
    return organizations
  }

  return organizations.map((org) => {
    if (org.id !== activeOrganizationId) {
      return org
    }

    const nextModules = Array.isArray(org.modules) ? [...org.modules] : []
    if (!nextModules.find((module) => module.name === name)) {
      nextModules.push({ name, submodules: [], transactionType, isCustom: true })
    }

    return { ...org, modules: nextModules }
  })
}

export function appendSubmoduleToModule(organizations, activeOrganizationId, moduleName, submoduleName) {
  const name = submoduleName.trim()
  if (!name) {
    return organizations
  }

  return organizations.map((org) => {
    if (org.id !== activeOrganizationId) {
      return org
    }

    const nextModules = (org.modules || []).map((module) => {
      if (module.name !== moduleName) {
        return module
      }

      const nextSubmodules = Array.isArray(module.submodules) ? [...module.submodules] : []
      if (!nextSubmodules.includes(name)) {
        nextSubmodules.push(name)
      }

      return { ...module, submodules: nextSubmodules }
    })

    return { ...org, modules: nextModules }
  })
}
