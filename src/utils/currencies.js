export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]

export function getCurrencyByCode(code) {
  const normalizedCode = String(code || 'USD').trim().toUpperCase()
  return CURRENCIES.find((currency) => currency.code === normalizedCode) || CURRENCIES[0]
}

export function normalizeCurrency(currency) {
  if (!currency || typeof currency !== 'object') {
    return getCurrencyByCode('USD')
  }

  const matchedCurrency = getCurrencyByCode(currency.code)

  return {
    code: matchedCurrency.code,
    name: currency.name || matchedCurrency.name,
    symbol: currency.symbol || matchedCurrency.symbol,
  }
}