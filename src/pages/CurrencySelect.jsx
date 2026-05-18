import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]

export default function CurrencySelect() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('USD')
  const [error, setError] = useState('')

  const selectedCurrency = useMemo(() => currencies.find((item) => item.code === currency), [currency])

  const handleContinue = (e) => {
    e.preventDefault()

    if (!selectedCurrency) {
      setError('Please select a currency')
      return
    }

    localStorage.setItem('selectedCurrency', JSON.stringify(selectedCurrency))
    navigate('/create-organization')
  }

  return (
    <div className="theme-light-violet relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-white to-sky-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center"
      >
        <div className="w-full rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl shadow-primary-500/10 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-primary-600">Setup Step 1 of 2</p>
            <h1 className="mt-3 text-3xl font-light tracking-tight text-slate-900 sm:text-4xl">Select Your Currency</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">Choose the default currency you want to use for your workspace.</p>
          </div>

          <form onSubmit={handleContinue} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {currencies.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setCurrency(item.code)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                    currency === item.code
                      ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-light text-slate-900">{item.code}</p>
                      <p className="text-sm text-slate-600">{item.name}</p>
                    </div>
                    <div className="text-2xl font-light text-primary-600">{item.symbol}</div>
                  </div>
                </button>
              ))}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                Continue
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
