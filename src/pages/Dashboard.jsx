import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowsRightLeftIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronDownIcon,
  CircleStackIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  Squares2X2Icon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

function deriveFirstName(user) {
  const raw = user?.firstName || user?.name || user?.email?.split('@')[0] || 'there'
  return raw.split(/[._-]/)[0].replace(/^[a-z]/, (letter) => letter.toUpperCase())
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency?.code || 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency?.symbol || '$'}${value.toLocaleString()}`
  }
}

function loadOrganizations() {
  const storedOrganizations = readJSON('organizations', [])
  if (storedOrganizations.length > 0) {
    return storedOrganizations
  }

  const singleOrganization = readJSON('organization', null)
  if (singleOrganization) {
    return [{ ...singleOrganization, id: singleOrganization.id || Date.now().toString() }]
  }

  return []
}

const moduleThemes = {
  lend: { label: 'Lend', bg: '#EFF6FF', fg: '#2563EB', iconBg: '#DBEAFE', icon: BanknotesIcon },
  borrow: { label: 'Borrow', bg: '#FFF7ED', fg: '#EA580C', iconBg: '#FFEDD5', icon: ArrowsRightLeftIcon },
  savings: { label: 'Savings', bg: '#ECFDF5', fg: '#059669', iconBg: '#D1FAE5', icon: CircleStackIcon },
  investments: { label: 'Investments', bg: '#F5F3FF', fg: '#7C3AED', iconBg: '#EDE9FE', icon: ChartBarIcon },
  custom: { label: 'Custom', bg: '#F8FAFC', fg: '#0F172A', iconBg: '#E2E8F0', icon: Squares2X2Icon },
}

function buildModuleCards(activeOrganization, currency) {
  if (!activeOrganization?.modules?.length) {
    return []
  }

  const baseAmounts = [12240, 6840, 18750, 9430, 5620, 8110]

  return activeOrganization.modules.map((module, index) => {
    const normalizedName = module.name.toLowerCase()
    const theme = moduleThemes[normalizedName] || moduleThemes.custom
    const amount = baseAmounts[index % baseAmounts.length] + index * 450

    return {
      id: `${module.name}-${index}`,
      label: module.name,
      submodules: module.submodules || [],
      amount: formatMoney(amount, currency),
      theme,
      fill: Math.min(92, 45 + index * 12),
    }
  })
}

function buildRecentActivity(activeOrganization, currency) {
  const modules = activeOrganization?.modules || []
  const names = modules.length > 0 ? modules.map((module) => module.name) : ['dashboard']

  return [
    { title: 'New funds allocated', meta: `${capitalize(names[0])} · 12 min ago`, amount: formatMoney(1420, currency), tone: 'text-emerald-600' },
    { title: 'Monthly expense cleared', meta: `${capitalize(names[1] || names[0])} · 1 hr ago`, amount: `-${formatMoney(560, currency)}`, tone: 'text-rose-600' },
    { title: 'Savings updated', meta: `${capitalize(names[2] || names[0])} · 3 hrs ago`, amount: formatMoney(880, currency), tone: 'text-sky-600' },
    { title: 'Investment review', meta: `${capitalize(names[3] || names[0])} · Yesterday`, amount: formatMoney(2140, currency), tone: 'text-violet-600' },
  ]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [organizations, setOrganizations] = useState(() => loadOrganizations())
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('activeOrgId') || loadOrganizations()[0]?.id || '')
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const currentUser = readJSON('currentUser', null)
  const selectedCurrency = readJSON('selectedCurrency', { code: 'USD', symbol: '$' })

  useEffect(() => {
    if (!activeOrgId && organizations[0]) {
      setActiveOrgId(organizations[0].id)
    }
  }, [activeOrgId, organizations])

  useEffect(() => {
    localStorage.setItem('organizations', JSON.stringify(organizations))
  }, [organizations])

  useEffect(() => {
    if (activeOrgId) {
      localStorage.setItem('activeOrgId', activeOrgId)
    }
  }, [activeOrgId])

  const activeOrganization = useMemo(() => {
    return organizations.find((item) => item.id === activeOrgId) || organizations[0] || null
  }, [organizations, activeOrgId])

  const activeCurrency = activeOrganization?.currency || selectedCurrency
  const firstName = deriveFirstName(currentUser)
  const moduleCards = buildModuleCards(activeOrganization, activeCurrency)
  const recentActivity = buildRecentActivity(activeOrganization, activeCurrency)

  const totalBalance = formatMoney(moduleCards.reduce((sum, card, index) => sum + [12240, 6840, 18750, 9430, 5620, 8110][index % 6] + index * 450, 0), activeCurrency)
  const revenueAmount = formatMoney(Math.round(moduleCards.length * 8400 + 1480), activeCurrency)
  const expensesAmount = formatMoney(Math.round(moduleCards.length * 2350 + 720), activeCurrency)
  const savingsAmount = formatMoney(Math.round(moduleCards.length * 1780 + 1180), activeCurrency)

  const handleSwitchOrg = (organizationId) => {
    setActiveOrgId(organizationId)
    setOrgMenuOpen(false)
    setProfileOpen(false)
  }

  const handleCreateNewOrg = () => {
    setOrgMenuOpen(false)
    navigate('/create-organization')
  }

  const handleManageOrg = () => {
    setOrgMenuOpen(false)
    navigate('/manage-organization')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-white shadow-lg shadow-blue-500/20">
                FT
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">FinTrack</p>
                <p className="text-lg font-semibold text-slate-900">Wallet App</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOrgMenuOpen((current) => !current)
                    setProfileOpen(false)
                  }}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <BuildingOffice2Icon className="h-4 w-4 text-blue-600" />
                  <span className="max-w-[130px] truncate sm:max-w-[180px]">
                    {activeOrganization?.organizationName || 'No organization'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {orgMenuOpen ? (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">Organizations</p>
                      <p className="text-xs text-slate-500">Switch between workspace organizations</p>
                    </div>
                    <div className="max-h-64 overflow-auto p-2">
                      {organizations.length > 0 ? (
                        organizations.map((organization) => (
                          <button
                            key={organization.id}
                            type="button"
                            onClick={() => handleSwitchOrg(organization.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-blue-50 ${
                              activeOrgId === organization.id ? 'bg-blue-50' : 'bg-transparent'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{organization.organizationName}</p>
                              <p className="text-xs text-slate-500">{organization.description || 'No description'}</p>
                            </div>
                            {activeOrgId === organization.id ? <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">Active</span> : null}
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No organizations found</div>
                      )}
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={handleCreateNewOrg}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        Create new organization
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((current) => !current)
                    setOrgMenuOpen(false)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label="Open profile details"
                >
                  <UserCircleIcon className="h-6 w-6 text-slate-600" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white">
                        {firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{firstName}</p>
                        <p className="text-xs text-slate-500">{currentUser?.email || 'No email found'}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Organization</span>
                        <span className="font-medium text-slate-900">{activeOrganization?.organizationName || 'None'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Currency</span>
                        <span className="font-medium text-slate-900">{activeCurrency?.code || 'USD'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Workspace status</span>
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                          <ShieldCheckIcon className="h-4 w-4" />
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <section className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.26em] text-blue-600">Dashboard</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Good afternoon, {firstName}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                You are viewing {activeOrganization?.organizationName || 'your workspace'}{activeOrganization?.description ? ` · ${activeOrganization.description}` : ''}.
              </p>
            </div>

            <div className="flex flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/add-transaction')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5"
              >
                Add Transaction
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/manage-organization')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Manage Organization
                <BuildingOffice2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {activeOrganization ? (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total balance', value: totalBalance, icon: BanknotesIcon, bg: '#EFF6FF', fg: '#2563EB', accent: 'text-slate-900' },
                { label: 'Revenue', value: revenueAmount, icon: ArrowTrendingUpIcon, bg: '#ECFDF5', fg: '#059669', accent: 'text-emerald-600' },
                { label: 'Expenses', value: expensesAmount, icon: ArrowTrendingDownIcon, bg: '#FEF2F2', fg: '#DC2626', accent: 'text-rose-600' },
                { label: 'Savings', value: savingsAmount, icon: CircleStackIcon, bg: '#F5F3FF', fg: '#7C3AED', accent: 'text-violet-600' },
              ].map((card, index) => (
                <motion.article
                  key={card.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.label}</p>
                      <p className={`mt-2 text-3xl font-bold tracking-tight ${card.accent}`}>{card.value}</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ backgroundColor: card.bg, color: card.fg }}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </section>

            <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Modules</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Modules you added</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  <Squares2X2Icon className="h-4 w-4" />
                  {moduleCards.length} modules
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {moduleCards.map((module, index) => (
                  <motion.article
                    key={module.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ delay: index * 0.05, duration: 0.45 }}
                    onClick={() => navigate(`/module/${encodeURIComponent(module.label)}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/module/${encodeURIComponent(module.label)}`)
                      }
                    }}
                    className="cursor-pointer rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl p-3" style={{ backgroundColor: module.theme.iconBg, color: module.theme.fg }}>
                          <module.theme.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold capitalize text-slate-900">{module.label}</p>
                          <p className="text-sm text-slate-500">{module.submodules.length} submodules</p>
                        </div>
                      </div>
                      <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-600">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{module.amount}</p>
                      </div>
                      <div className="text-right text-xs font-medium text-slate-500">Allocated</div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white">
                      <div className="h-full rounded-full" style={{ width: `${module.fill}%`, backgroundColor: module.theme.fg }} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {module.submodules.map((submodule) => (
                        <span key={submodule} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                          {submodule}
                        </span>
                      ))}
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Recent activity</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Latest updates</h2>
                  </div>
                  <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                    <CalendarDaysIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {recentActivity.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.meta}</p>
                      </div>
                      <p className={`text-sm font-semibold ${item.tone}`}>{item.amount}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Current summary</h2>
                  </div>
                  <div className="rounded-full bg-violet-50 p-3 text-violet-600">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4 rounded-[1.5rem] bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Organization</span>
                    <span className="font-semibold text-slate-900">{activeOrganization.organizationName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Currency</span>
                    <span className="font-semibold text-slate-900">{activeCurrency?.code || 'USD'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Modules</span>
                    <span className="font-semibold text-slate-900">{moduleCards.length}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tip</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">Add a transaction first to start tracking</p>
                    </div>
                    <PlusIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">No organization yet</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Create your first organization to get started</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Once you create an organization and add modules, your dashboard will automatically show balances, modules, and recent activity here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/create-organization')}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5"
            >
              Create Organization
              <PlusIcon className="h-4 w-4" />
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
