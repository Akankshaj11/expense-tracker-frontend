import { useState } from 'react'

const sampleExpenses = [
  { id: 1, title: 'Office supplies', amount: 42.5, category: 'Work' },
  { id: 2, title: 'Lunch', amount: 18.2, category: 'Food' },
  { id: 3, title: 'Internet', amount: 79.0, category: 'Utilities' },
]

export default function App() {
  const [expenses] = useState(sampleExpenses)

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">React frontend only</p>
        <h1>Expense tracker starter</h1>
        <p className="lede">
          A clean frontend-only starting point for building an expense tracker in React.
        </p>
        <div className="status-card">
          <span>Project status</span>
          <strong>Frontend lives at root</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent expenses</h2>
          <button type="button">Add expense</button>
        </div>

        <div className="expense-list">
          {expenses.map((expense) => (
            <article key={expense.id} className="expense-item">
              <div>
                <h3>{expense.title}</h3>
                <p>{expense.category}</p>
              </div>
              <strong>${expense.amount.toFixed(2)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}