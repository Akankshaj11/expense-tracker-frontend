import { apiRequest } from './api'

// Helper to parse JSON safely
function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

// Get the books of an organization (following the AppState.dart parsing logic)
export function getBooksFromOrganization(organization) {
  if (!organization) return []

  let books = []

  // 1. Try description-serialized books (more reliable for delete/rename operations)
  const rawDesc = organization.description || ""
  if (rawDesc.includes("|||")) {
    const parts = rawDesc.split("|||")
    try {
      books = JSON.parse(parts[1].trim())
    } catch (e) {
      console.error("Error parsing books from description:", e)
    }
  }

  // 2. Fallback to first-class backend books field
  if (!books || books.length === 0) {
    const rawBooks = organization.books
    if (Array.isArray(rawBooks) && rawBooks.length > 0) {
      books = rawBooks
    }
  }

  // 3. Fallback to default book
  if (!books || books.length === 0) {
    books = [
      {
        name: "Default Book",
        description: "Default workspace book",
        categories: [
          { name: "Revenue", type: "in", subcategories: ["Salary", "Freelance", "Bonus", "Interest", "Commission", "Pocket Money"] },
          { name: "Expenses", type: "out", subcategories: ["Food", "Travel", "Shopping", "Bills", "Health", "Entertainment", "Education", "Rent", "Subscriptions", "Loans", "Taxes"] },
          { name: "Investments", type: "out", subcategories: ["Mutual Funds", "Stocks", "Crypto", "Fixed Deposit", "Gold"] },
          { name: "Investment Returns", type: "in", subcategories: ["Mutual Funds", "Stocks", "Crypto", "Fixed Deposit", "Gold"] },
          { name: "Lend", type: "out", subcategories: ["Friends", "Family", "Colleagues"] },
          { name: "Borrow", type: "in", subcategories: ["Friends", "Family", "Colleagues"] }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  return books
}

// Save the list of books to the backend and localStorage
export async function saveBooksList(activeOrgId, updatedBooks, organizations, setOrganizations) {
  if (!activeOrgId) return false

  const activeOrg = organizations.find((org) => org.id === activeOrgId)
  if (!activeOrg) return false

  // Union categories/subcategories
  const allCategories = []
  const allsubcategories = {}
  for (const b of updatedBooks) {
    for (const m of b.categories) {
      if (!allCategories.some((mod) => mod.name.toLowerCase() === m.name.toLowerCase())) {
        allCategories.push({
          name: m.name,
          direction: m.type,
          categoryType: m.type,
          transactionType: m.type,
        })
      }
      const existingSubs = allsubcategories[m.name] || []
      for (const sub of m.subcategories) {
        if (!existingSubs.includes(sub)) {
          existingSubs.push(sub)
        }
      }
      allsubcategories[m.name] = existingSubs
    }
  }

  const rawDesc = activeOrg.description || ""
  const parts = rawDesc.split("|||")
  const baseDesc = parts[0].trim()
  const finalDesc = `${baseDesc} ||| ${JSON.stringify(updatedBooks)}`

  const isMongoId = /^[a-f0-9]{24}$/.test(activeOrgId)
  const updatePayload = {
    description: finalDesc,
    books: updatedBooks,
    categories: allCategories,
    subcategories: allsubcategories,
  }

  let updatedOrg = null
  if (isMongoId) {
    const response = await apiRequest(`/organizations/${activeOrgId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    })
    updatedOrg = response?.data || null
  } else {
    updatedOrg = {
      ...activeOrg,
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    }
  }

  if (updatedOrg) {
    const updatedOrganizations = organizations.map((org) =>
      org.id === activeOrgId ? { ...org, ...updatedOrg } : org
    )

    localStorage.setItem('organizations', JSON.stringify(updatedOrganizations))
    localStorage.setItem('organization', JSON.stringify(updatedOrg))

    if (typeof setOrganizations === 'function') {
      setOrganizations(updatedOrganizations)
    }

    // Dispatch event to sync state across windows/components
    window.dispatchEvent(new Event('storage'))
    return true
  }

  return false
}

// Add a new book
export async function addNewBook(activeOrgId, name, description, organizations, setOrganizations) {
  const books = getBooksFromOrganization(organizations.find((org) => org.id === activeOrgId))
  
  if (books.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("A book with this name already exists")
  }

  const defaultCategories = [
    { name: "Revenue", type: "in", subcategories: ["Salary", "Freelance", "Bonus", "Interest", "Commission", "Pocket Money"] },
    { name: "Expenses", type: "out", subcategories: ["Food", "Travel", "Shopping", "Bills", "Health", "Entertainment", "Education", "Rent", "Subscriptions", "Loans", "Taxes"] },
    { name: "Investments", type: "out", subcategories: ["Mutual Funds", "Stocks", "Crypto", "Fixed Deposit", "Gold"] },
    { name: "Investment Returns", type: "in", subcategories: ["Mutual Funds", "Stocks", "Crypto", "Fixed Deposit", "Gold"] },
    { name: "Lend", type: "out", subcategories: ["Friends", "Family", "Colleagues"] },
    { name: "Borrow", type: "in", subcategories: ["Friends", "Family", "Colleagues"] }
  ]

  const newBook = {
    name,
    description,
    categories: defaultCategories,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updatedBooksList = [...books, newBook]
  return await saveBooksList(activeOrgId, updatedBooksList, organizations, setOrganizations)
}

// Rename a book and update its transactions
export async function renameBook(activeOrgId, oldName, newName, organizations, setOrganizations) {
  const books = getBooksFromOrganization(organizations.find((org) => org.id === activeOrgId))
  
  if (books.some((b) => b.name.toLowerCase() === newName.toLowerCase() && b.name !== oldName)) {
    throw new Error("A book with this name already exists")
  }

  const updatedBooksList = books.map((b) => {
    if (b.name === oldName) {
      return {
        ...b,
        name: newName,
        updatedAt: new Date().toISOString(),
      }
    }
    return b
  })

  const success = await saveBooksList(activeOrgId, updatedBooksList, organizations, setOrganizations)
  if (success) {
    // Update local transactions
    const localTxns = readJSON('transactions', [])
    const updatedTxns = localTxns.map((t) => {
      if (t.organizationId === activeOrgId && t.book === oldName) {
        return { ...t, book: newName }
      }
      return t
    })
    localStorage.setItem('transactions', JSON.stringify(updatedTxns))

    // Call backend to update remote transactions if they are MongoDB ObjectIds
    const targetTransactions = localTxns.filter(
      (t) => t.organizationId === activeOrgId && t.book === oldName
    )
    for (const t of targetTransactions) {
      const isMongoId = /^[a-f0-9]{24}$/.test(t.id || t._id)
      if (isMongoId) {
        try {
          await apiRequest(`/transactions/${t.id || t._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ book: newName }),
          })
        } catch (e) {
          console.error(`Failed to update transaction ${t.id} to new book name:`, e)
        }
      }
    }
    window.dispatchEvent(new Event('transactions:updated'))
    return true
  }
  return false
}

// Delete a book and its transactions
export async function deleteBook(activeOrgId, bookName, organizations, setOrganizations) {
  const books = getBooksFromOrganization(organizations.find((org) => org.id === activeOrgId))
  const updatedBooksList = books.filter((b) => b.name !== bookName)

  const success = await saveBooksList(activeOrgId, updatedBooksList, organizations, setOrganizations)
  if (success) {
    // Delete local transactions belonging to this book
    const localTxns = readJSON('transactions', [])
    const nextTxns = localTxns.filter(
      (t) => !(t.organizationId === activeOrgId && t.book === bookName)
    )
    localStorage.setItem('transactions', JSON.stringify(nextTxns))

    // Call backend to delete transactions belonging to this book
    const targetTransactions = localTxns.filter(
      (t) => t.organizationId === activeOrgId && t.book === bookName
    )
    for (const t of targetTransactions) {
      const isMongoId = /^[a-f0-9]{24}$/.test(t.id || t._id)
      if (isMongoId) {
        try {
          await apiRequest(`/transactions/${t.id || t._id}`, {
            method: 'DELETE',
          })
        } catch (e) {
          console.error(`Failed to delete transaction ${t.id}:`, e)
        }
      }
    }
    window.dispatchEvent(new Event('transactions:updated'))
    return true
  }
  return false
}
