// Repo file header
export const transactionTypeCategories = {
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

// Function: getCategoryCategory
export function getCategoryCategory(category) {
  const transactionType = String(category?.direction || category?.transactionType || category?.type || '').toLowerCase()
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

  const categoryName = String(category?.name || '').toLowerCase()
  if (categoryName === 'revenue' || categoryName === 'revenues') {
    return 'revenue'
  }

  if (categoryName === 'in') {
    return 'revenue'
  }

  if (categoryName === 'expense' || categoryName === 'expenses') {
    return 'expenses'
  }

  if (categoryName === 'out') {
    return 'expenses'
  }

  if (categoryName === 'investment' || categoryName === 'investments') {
    return 'investments'
  }

  if (categoryName === 'lend') {
    return 'expenses'
  }

  if (categoryName === 'borrow') {
    return 'revenue'
  }

  for (const [category, names] of Object.entries(transactionTypeCategories)) {
    if (names.some((name) => name.toLowerCase() === categoryName)) {
      return category
    }
  }

  return null
}

// Function: getPersistedCategoryTransactionType
export function getPersistedCategoryTransactionType(category) {
  const raw = category?.direction || category?.transactionType || getCategoryCategory(category) || 'revenue'
  const normalized = String(raw || '').toLowerCase()
  if (['in', 'income', 'revenue', 'credit', 'incoming', 'plus', '+'].includes(normalized)) return 'in'
  if (['out', 'expense', 'expenses', 'debit', 'outgoing', 'minus', '-'].includes(normalized)) return 'out'
  if (['investment', 'investments'].includes(normalized)) return 'investments'
  return 'in'
}

// Function: getCategoriesForCategory
export function getCategoriesForCategory(category, categories) {
  const normalizedCategory = String(category || '').toLowerCase()
  return (categories || []).filter((category) => {
    const categoryCategory = getCategoryCategory(category)
    return categoryCategory === normalizedCategory
  })
}

// Function: getCategorySubcategories
export function getCategorySubcategories(category, organization) {
  if (Array.isArray(category?.subcategories)) {
    return category.subcategories
  }

  if (category?.name && Array.isArray(organization?.subcategories?.[category.name])) {
    return organization.subcategories[category.name]
  }

  return []
}

// Function: buildCategoryOptions
export function buildCategoryOptions(organizationCategories) {
  if (!organizationCategories.length) {
    return [
      { name: 'Revenue', category: 'revenue' },
      { name: 'Expenses', category: 'expenses' },
      { name: 'Investments', category: 'investments' },
      { name: 'Custom', category: 'custom' },
    ]
  }

  return organizationCategories.map((category) => ({
    ...category,
    category: getCategoryCategory(category) || 'revenue',
  }))
}
