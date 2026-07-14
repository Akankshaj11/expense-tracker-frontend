// Repo file header
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { CURRENCIES } from '../../utils/currencies'

export default function CurrencySelect() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('USD')
  const [error, setError] = useState('')

  const selectedCurrency = useMemo(() => CURRENCIES.find((item) => item.code === currency), [currency])

  // Function: handleContinue
  const handleContinue = (e) => {
    e.preventDefault()

    if (!selectedCurrency) {
      setError('Please select a currency')
      return
    }

        localStorage.setItem('selectedCurrency', JSON.stringify(selectedCurrency))
        navigate('/select-language')
  }

  return (
    <div className="theme-light-violet relative h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-sky-100 px-4 py-2 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex w-full max-w-xl items-center justify-center my-auto"
      >
        <div className="w-full rounded-[1.5rem] border border-white/80 bg-white p-4 shadow-2xl shadow-primary-500/10 sm:p-6">
          <div className="mb-3 flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white px-3 py-1.5 text-xs font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              ← Back
            </button>
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-primary-600">Setup Step 1 of 3</p>
            <h1 className="mt-1.5 text-2xl font-light tracking-tight text-slate-900 sm:text-3xl">Select Your Currency</h1>
            <p className="mt-1 text-sm text-slate-600">Choose the default currency you want to use for your workspace.</p>
          </div>

          <form onSubmit={handleContinue} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CURRENCIES.map((item) => (
                <button
                   key={item.code}
                   type="button"
                   onClick={() => setCurrency(item.code)}
                   className={`rounded-xl border p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                     currency === item.code
                       ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10'
                       : 'border-slate-200 bg-white'
                   }`}
                >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-light text-slate-900">{item.code}</p>
                        <p className="text-xs text-slate-600"><span className="currency-symbol">{item.symbol}</span></p>
                      </div>
                      <div className="text-lg font-light text-primary-600"><span className="currency-symbol">{item.symbol}</span></div>
                    </div>
                </button>
              ))}
            </div>

            {error ? <p className="text-xs text-red-600 my-1">{error}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2 text-xs font-light text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5"
              >
                Continue
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
