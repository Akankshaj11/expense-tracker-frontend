import { motion } from 'framer-motion'
import { BanknotesIcon, BuildingLibraryIcon, ChartBarIcon, CircleStackIcon, CurrencyDollarIcon, CreditCardIcon } from '@heroicons/react/24/outline'

export default function DashboardMetricCards({ cards, totalBalanceValue, revenueAmountValue, expensesAmountValue, activeCurrency, locale, className }) {
  const cardIconMap = {
    balance: CircleStackIcon,
    revenue: CurrencyDollarIcon,
    expenses: CreditCardIcon,
    investments: ChartBarIcon,
    lend: BanknotesIcon,
    borrow: BuildingLibraryIcon,
  }

  return (
    <section className={`mt-8 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className || ''}`}>
      {cards.map((card, index) => {
        const isBalanceCard = card.kind === 'balance'
        const isRevenueCard = card.kind === 'revenue'
        const isExpensesCard = card.kind === 'expenses'
        const isNegativeBalance = isBalanceCard && totalBalanceValue < 0
        const isPositiveBalance = isBalanceCard && totalBalanceValue > 0
        const isZeroRevenue = isRevenueCard && revenueAmountValue === 0
        const isZeroExpenses = isExpensesCard && expensesAmountValue === 0
        const CardIcon = cardIconMap[card.kind] || CircleStackIcon
        const displayAccent = isBalanceCard
          ? isPositiveBalance
            ? 'text-emerald-600'
            : isNegativeBalance
              ? 'text-rose-600'
              : 'text-blue-600'
          : card.accent
        const displaySign = isBalanceCard
          ? isPositiveBalance
            ? '+'
            : isNegativeBalance
              ? '-'
              : ''
          : isRevenueCard && !isZeroRevenue
            ? '+'
            : isExpensesCard && !isZeroExpenses
              ? '-'
              : ''
        const displayValue = isBalanceCard ? new Intl.NumberFormat(locale, { style: 'currency', currency: activeCurrency?.code || 'USD', maximumFractionDigits: 0 }).format(Math.abs(totalBalanceValue)) : card.value
        const iconAccentClass = 'text-blue-600 bg-blue-50'

        return (
          <motion.article
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.06, duration: 0.45 }}
            className="flex h-full rounded-[1.75rem] border border-white/6 bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-full w-full items-start justify-between gap-3">
              <div className="flex flex-col items-start gap-1">
                <p className="text-sm font-light text-slate-500">{card.label}</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-3xl font-light tracking-tight ${displayAccent}`}>
                  <span>{displaySign}</span>
                  {displayValue}
                </p>
              </div>
              <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconAccentClass}`}>
                <CardIcon className="h-5 w-5" />
              </div>
            </div>
          </motion.article>
        )
      })}
    </section>
  )
}