// Repo file header
export const transactionTypeModules = {
  revenue: ['Salary', 'Business', 'Bonus', 'Commission', 'Incentives', 'Rental Income', 'Investment Returns'],
  expenses: ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Rent', 'Subscriptions', 'Loans', 'Taxes'],
  investments: ['Stocks', 'Mutual Funds', 'Fixed Deposit', 'Gold', 'Real Estate', 'PPF'],
}

// Function: getTransactionCategory
export function getTransactionCategory(transaction) {
  const transactionType = String(transaction?.transactionType || transaction?.direction || transaction?.transactionDirection || '').toLowerCase()

  if (['revenue', 'income', 'in', 'credit', 'incoming', 'plus', '+'].includes(transactionType)) {
    return 'revenue'
  }

  if (['expense', 'expenses', 'out', 'debit', 'outgoing', 'minus', '-'].includes(transactionType)) {
    return 'expenses'
  }

  if (['investment', 'investments'].includes(transactionType)) {
    return 'investments'
  }

  return null
}

// Function: getModuleCategory
export function getModuleCategory(module) {
  const transactionType = String(module?.transactionType || module?.type || '').toLowerCase()
  if (transactionType === 'revenue') {
    return 'revenue'
  }
  if (transactionType === 'in') {
    return 'revenue'
  }
  if (transactionType === 'expenses' || transactionType === 'expense') {
    return 'expenses'
  }
  if (transactionType === 'out') {
    return 'expenses'
  }
  if (transactionType === 'investments' || transactionType === 'investment') {
    return 'investments'
  }

  if (transactionType === 'custom') {
    return 'custom'
  }

  const moduleName = String(module?.name || '').toLowerCase()
  if (moduleName === 'revenue' || moduleName === 'revenues') {
    return 'revenue'
  }

  if (moduleName === 'in') {
    return 'revenue'
  }

  if (moduleName === 'expense' || moduleName === 'expenses') {
    return 'expenses'
  }

  if (moduleName === 'out') {
    return 'expenses'
  }

  if (moduleName === 'investment' || moduleName === 'investments') {
    return 'investments'
  }

  if (moduleName === 'lend') {
    return 'expenses'
  }

  if (moduleName === 'borrow') {
    return 'revenue'
  }

  for (const [category, names] of Object.entries(transactionTypeModules)) {
    if (names.some((name) => name.toLowerCase() === moduleName)) {
      return category
    }
  }

  return null
}

// Function: getPersistedModuleTransactionType
export function getPersistedModuleTransactionType(module) {
  const raw = module?.transactionType || getModuleCategory(module) || 'revenue'
  const normalized = String(raw || '').toLowerCase()
  if (['in', 'income', 'revenue', 'credit', 'incoming', 'plus', '+'].includes(normalized)) return 'in'
  if (['out', 'expense', 'expenses', 'debit', 'outgoing', 'minus', '-'].includes(normalized)) return 'out'
  if (['investment', 'investments'].includes(normalized)) return 'investments'
  return 'in'
}

// Function: getModulesForCategory
export function getModulesForCategory(category, modules) {
  const normalizedCategory = String(category || '').toLowerCase()
  return (modules || []).filter((module) => {
    const moduleCategory = getModuleCategory(module)
    return moduleCategory === normalizedCategory
  })
}

// Function: getModuleSubmodules
export function getModuleSubmodules(module, organization) {
  if (Array.isArray(module?.submodules)) {
    return module.submodules
  }

  if (module?.name && Array.isArray(organization?.submodules?.[module.name])) {
    return organization.submodules[module.name]
  }

  return []
}

// Function: buildModuleOptions
export function buildModuleOptions(organizationModules) {
  if (!organizationModules.length) {
    return [
      { name: 'Revenue', category: 'revenue' },
      { name: 'Expenses', category: 'expenses' },
      { name: 'Investments', category: 'investments' },
      { name: 'Custom', category: 'custom' },
    ]
  }

  return organizationModules.map((module) => ({
    ...module,
    category: getModuleCategory(module) || 'revenue',
  }))
}
