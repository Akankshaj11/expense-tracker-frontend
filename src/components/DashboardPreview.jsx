import { motion } from 'framer-motion'
import { ArrowTrendingUpIcon, ChartPieIcon, PlusIcon } from '@heroicons/react/24/outline'

const activity = [
	{ title: 'Salary credited', meta: 'Revenue · 09:12', amount: '+$3,200', accent: 'text-primary-600' },
	{ title: 'Fuel expense', meta: 'Expenses · 11:40', amount: '-$48', accent: 'text-red-500' },
	{ title: 'Index fund', meta: 'Investments · 14:22', amount: '-$250', accent: 'text-amber-500' },
]

export default function DashboardPreview() {
	return (
		<section id="analytics" className="mt-16 scroll-mt-28">
			<div className="flex items-end justify-between gap-4">
				<div className="max-w-2xl">
					<p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-600">Analytics</p>
					<h3 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">Analytics-ready dashboard preview</h3>
					<p className="mt-4 text-base leading-7 text-[var(--muted)]">A polished surface for charts, trends, recent activity, and decision-making metrics without visual clutter.</p>
				</div>
				<div className="hidden rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 md:inline-flex">
					<ArrowTrendingUpIcon className="mr-2 h-4 w-4" /> Live trend
				</div>
			</div>

			<motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.55 }} className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
				<div className="card-floating rounded-[1.75rem] p-5 sm:p-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-[var(--muted)]">Balance overview</p>
							<div className="mt-1 flex items-end gap-3">
								<h4 className="text-3xl font-bold tracking-tight text-[var(--text)]">$24,532.40</h4>
								<span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">+12.4%</span>
							</div>
						</div>
						<div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
							<ChartPieIcon className="h-6 w-6" />
						</div>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-4">
						{[
							{ label: 'Revenue', value: '$12,120', tone: 'from-primary-50 to-primary-100' },
							{ label: 'Expenses', value: '$4,220', tone: 'from-red-50 to-red-100' },
							{ label: 'Savings', value: '$6,780', tone: 'from-cyan-50 to-cyan-100' },
							{ label: 'Investments', value: '$1,412', tone: 'from-violet-50 to-violet-100' },
						].map((card) => (
							<div key={card.label} className={`rounded-2xl border border-white bg-gradient-to-br ${card.tone} p-4 shadow-sm`}>
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{card.label}</p>
								<p className="mt-2 text-xl font-bold text-[var(--text)]">{card.value}</p>
							</div>
						))}
					</div>

					<div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
						<div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-[var(--text)]">Spending mix</p>
									<p className="text-xs text-[var(--muted)]">Category distribution</p>
								</div>
								<div className="flex h-12 w-12 items-center justify-center rounded-full border-[8px] border-primary-100 border-t-primary-500" />
							</div>
							<div className="mt-4 space-y-3">
								{[
									['Food', 72],
									['Fuel', 43],
									['Bills', 58],
								].map(([label, width]) => (
									<div key={label}>
										<div className="mb-1 flex items-center justify-between text-sm text-[var(--muted)]">
											<span>{label}</span>
											<span>{width}%</span>
										</div>
										<div className="h-2 rounded-full bg-primary-50">
											<motion.div initial={{ width: 0 }} whileInView={{ width: `${width}%` }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" />
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white shadow-lg shadow-primary-500/25">
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Trends</p>
							<p className="mt-2 text-lg font-semibold">Revenue trend loading</p>
							<div className="mt-6 flex h-40 items-end gap-3">
								{[28, 42, 36, 58, 50, 72, 64].map((height, index) => (
									<motion.span key={index} initial={{ height: 0 }} whileInView={{ height: `${height}px` }} viewport={{ once: true }} transition={{ duration: 0.55, delay: index * 0.06 }} className="block flex-1 rounded-t-full bg-white/85" />
								))}
							</div>
						</div>
					</div>
				</div>

				<aside className="card-floating rounded-[1.75rem] p-5 sm:p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-[var(--muted)]">Recent activity</p>
							<h4 className="mt-1 text-xl font-semibold text-[var(--text)]">Today</h4>
						</div>
						<div className="rounded-full bg-primary-50 p-2 text-primary-600">
							<PlusIcon className="h-4 w-4" />
						</div>
					</div>

					<div className="mt-5 space-y-3">
						{activity.map((item) => (
							<div key={item.title} className="flex items-center justify-between rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
								<div>
									<p className="font-medium text-[var(--text)]">{item.title}</p>
									<p className="text-xs text-[var(--muted)]">{item.meta}</p>
								</div>
								<p className={`text-sm font-semibold ${item.accent}`}>{item.amount}</p>
							</div>
						))}
					</div>

					<div className="mt-5 rounded-2xl bg-primary-50 p-4">
						<p className="text-sm font-semibold text-primary-700">Smart summary</p>
						<p className="mt-2 text-sm leading-6 text-[var(--muted)]">Your top spending cluster is food and fuel. Savings remain above target for the month.</p>
					</div>
				</aside>
			</motion.div>
		</section>
	)
}
