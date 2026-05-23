export function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function formatMoney(value, currency, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${Number(value || 0).toFixed(2)}`
  }
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''))
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function sanitizeAmountInput(value) {
  return value.replace(/[^\d+\-*/().\s]/g, '')
}

export function tokenizeExpression(expression) {
  return expression.match(/\d+(?:\.\d+)?|[+\-*/()]/g) || []
}

function getLastOperatorIndex(expression) {
  return Math.max(
    expression.lastIndexOf('+'),
    expression.lastIndexOf('-'),
    expression.lastIndexOf('*'),
    expression.lastIndexOf('/'),
  )
}

function isValidExpression(expression) {
  const sanitized = expression.replace(/\s+/g, '')
  if (!sanitized) {
    return false
  }

  if (!/^[\d+\-*/().]+$/.test(sanitized)) {
    return false
  }

  if (!/\d/.test(sanitized)) {
    return false
  }

  if (/[+\-*/.]$/.test(sanitized)) {
    return false
  }
  if (/^[+*/]/.test(sanitized)) {
    return false
  }

  try {
    const result = Function(`"use strict"; return (${sanitized})`)()
    return Number.isFinite(result)
  } catch {
    return false
  }
}

export function evaluateExpression(expression) {
  if (!isValidExpression(expression)) {
    return null
  }

  try {
    const sanitized = expression.replace(/\s+/g, '')
    const result = Function(`"use strict"; return (${sanitized})`)()
    return Number.isFinite(result) ? Number(result) : null
  } catch {
    return null
  }
}

export function getPreviewExpression(expression) {
  return expression.replace(/\s+/g, '').replace(/[+\-*/]+$/, '')
}

export function getAmountInputDisplay(expression) {
  const sanitized = expression.replace(/\s+/g, '')
  if (!sanitized || /[+\-*/]$/.test(sanitized)) {
    return ''
  }

  const lastOperatorIndex = getLastOperatorIndex(sanitized)
  if (lastOperatorIndex === -1) {
    return sanitized
  }

  return sanitized.slice(lastOperatorIndex + 1)
}

export function buildAmountExpression(currentExpression, nextValue) {
  const current = currentExpression.replace(/\s+/g, '')
  const sanitizedNext = sanitizeAmountInput(nextValue)

  if (!sanitizedNext) {
    if (!current) {
      return ''
    }

    if (/[+\-*/]$/.test(current)) {
      return current.slice(0, -1)
    }

    const lastOperatorIndex = getLastOperatorIndex(current)
    return lastOperatorIndex === -1 ? '' : current.slice(0, lastOperatorIndex + 1)
  }

  if (/[+\-*/]$/.test(sanitizedNext)) {
    if (!current) {
      return sanitizedNext
    }

    if (/[+\-*/]$/.test(current)) {
      return current
    }

    return `${current}${sanitizedNext.slice(-1)}`
  }

  if (/[+\-*/]$/.test(current)) {
    return `${current}${sanitizedNext}`
  }

  const lastOperatorIndex = getLastOperatorIndex(current)
  if (lastOperatorIndex === -1) {
    return sanitizedNext
  }

  return `${current.slice(0, lastOperatorIndex + 1)}${sanitizedNext}`
}

export function removeTokenFromExpression(expression, removeIndex) {
  const tokens = tokenizeExpression(expression)
  if (tokens.length === 0 || removeIndex < 0 || removeIndex >= tokens.length) {
    return expression
  }

  const nextTokens = [...tokens]
  const token = nextTokens[removeIndex]
  if (!/\d/.test(token)) {
    return expression
  }

  const deleteIndexes = [removeIndex]
  if (removeIndex > 0 && /[+\-*/]/.test(nextTokens[removeIndex - 1])) {
    deleteIndexes.push(removeIndex - 1)
  }
  if (removeIndex < nextTokens.length - 1 && /[+\-*/]/.test(nextTokens[removeIndex + 1])) {
    deleteIndexes.push(removeIndex + 1)
  }

  deleteIndexes
    .sort((left, right) => right - left)
    .forEach((index) => nextTokens.splice(index, 1))

  const normalizedTokens = []
  nextTokens.forEach((currentToken) => {
    const isOperator = /[+\-*/]/.test(currentToken)
    const previousToken = normalizedTokens[normalizedTokens.length - 1]

    if (!previousToken) {
      if (!isOperator) {
        normalizedTokens.push(currentToken)
      }
      return
    }

    if (!isOperator && /\d/.test(previousToken)) {
      normalizedTokens.push('+')
      normalizedTokens.push(currentToken)
      return
    }

    if (isOperator && /[+\-*/]/.test(previousToken)) {
      normalizedTokens[normalizedTokens.length - 1] = currentToken
      return
    }

    if (!isOperator || normalizedTokens.length === 0 || /[+\-*/]/.test(previousToken)) {
      normalizedTokens.push(currentToken)
    }
  })

  while (normalizedTokens.length > 0 && /[+\-*/]/.test(normalizedTokens[0])) {
    normalizedTokens.shift()
  }

  while (normalizedTokens.length > 0 && /[+\-*/]/.test(normalizedTokens[normalizedTokens.length - 1])) {
    normalizedTokens.pop()
  }

  return normalizedTokens.join(' ')
}
