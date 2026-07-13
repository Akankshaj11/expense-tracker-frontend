// Repo file header
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { CURRENCIES, getCurrencyByCode } from '../../utils/currencies'
import logo from '../../assets/logo.png'

// Function: LanguageRow
function LanguageRow({ language, setLanguage, text }) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex-1 rounded-xl px-2 py-3 text-center text-xs font-light transition sm:px-3 sm:text-sm ${language === 'en' ? 'bg-primary-50 text-primary-700' : 'bg-[var(--card)] text-[var(--text)] hover:bg-primary-50'}`}
      >
        {text.english}
        {language === 'en' ? <span className="ml-1 text-xs text-primary-700">✓</span> : null}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('mr')}
        className={`flex-1 rounded-xl px-2 py-3 text-center text-xs font-light transition sm:px-3 sm:text-sm ${language === 'mr' ? 'bg-primary-50 text-primary-700' : 'bg-[var(--card)] text-[var(--text)] hover:bg-primary-50'}`}
      >
        {text.marathi}
        {language === 'mr' ? <span className="ml-1 text-xs text-primary-700">✓</span> : null}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`flex-1 rounded-xl px-2 py-3 text-center text-xs font-light transition sm:px-3 sm:text-sm ${language === 'hi' ? 'bg-primary-50 text-primary-700' : 'bg-[var(--card)] text-[var(--text)] hover:bg-primary-50'}`}
      >
        {text.hindi}
        {language === 'hi' ? <span className="ml-1 text-xs text-primary-700">✓</span> : null}
      </button>
    </div>
  )
}

// Function: useIsDesktop
function useIsDesktop() {
  // Function: getMatch
  const getMatch = () => (typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true)
  const [isDesktop, setIsDesktop] = useState(getMatch)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    // Function: handleChange
    const handleChange = (event) => setIsDesktop(event.matches)

    setIsDesktop(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  return isDesktop
}

// Function: OrganizationMenu
function OrganizationMenu({ activeOrgId, activeOrganization, organizations, orgMenuOpen, setOrgMenuOpen, setProfileOpen, handleSwitchOrg, handleCreateNewOrg, text, mobile = false }) {
  const containerRef = useRef(null)
  const isDesktop = useIsDesktop()
  const isActiveView = mobile ? !isDesktop : isDesktop

  useEffect(() => {
    if (!orgMenuOpen || !isActiveView) {
      return undefined
    }

    // Function: handlePointerDown
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOrgMenuOpen(false)
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [orgMenuOpen, isActiveView, setOrgMenuOpen, setProfileOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOrgMenuOpen((current) => !current)
          setProfileOpen(false)
        }}
        className="inline-flex items-center gap-3 rounded-full border border-white/6 bg-[var(--card)] px-4 py-2.5 text-sm font-light text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <BuildingOffice2Icon className="h-4 w-4 text-primary-600" />
        <span className="max-w-[130px] truncate sm:max-w-[180px]">
          {activeOrganization?.organizationName || text.noOrganizationYet}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
      </button>

      {orgMenuOpen ? (
        <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-white/6 bg-[var(--card)] shadow-2xl shadow-slate-200/80">
          <div className="border-b border-white/4 px-4 py-3">
            <p className="text-sm font-light text-[var(--text)]">{text.organizationMenuTitle}</p>
            <p className="text-xs text-slate-500">{text.organizationMenuSubtitle}</p>
          </div>
          <div className="max-h-64 overflow-auto p-2">
            {organizations.length > 0 ? (
              organizations.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => handleSwitchOrg(organization.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-primary-50 ${
                    activeOrgId === organization.id ? 'bg-primary-50' : 'bg-transparent'
                  }`}
                >
                  <div>
                    <p className="text-sm font-light text-[var(--text)]">{organization.organizationName}</p>
                    <p className="text-xs text-slate-500">{organization.description || text.noDescription}</p>
                  </div>
                  {activeOrgId === organization.id ? <span className="rounded-full bg-primary-600 px-2 py-1 text-[10px] font-light text-white">{text.active}</span> : null}
                </button>
              ))
            ) : (
              <div className="rounded-xl bg-[var(--card)] px-3 py-4 text-sm text-slate-500">{text.noOrganizationsFound}</div>
            )}
          </div>
          <div className="border-t border-white/4 p-2">
            <button
              type="button"
              onClick={handleCreateNewOrg}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-light text-primary-700 transition hover:bg-primary-50"
            >
              {text.createNewOrganization}
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Function: ProfileMenu
function ProfileMenu({ currentUser, firstName, activeOrganization, activeCurrency, profileOpen, setProfileOpen, setOrgMenuOpen, language, setLanguage, handleLogout, handleChangeCurrency, text, mobile = false }) {
  const containerRef = useRef(null)
  const isDesktop = useIsDesktop()
  const isActiveView = mobile ? !isDesktop : isDesktop
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false)
  const panelClassName = mobile
    ? 'absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-white/6 bg-[var(--card)] p-4 shadow-2xl shadow-slate-200/80'
    : 'absolute right-0 mt-3 w-72 rounded-2xl border border-white/6 bg-[var(--card)] p-4 shadow-2xl shadow-slate-200/80'

  useEffect(() => {
    if (!profileOpen) {
      setCurrencyMenuOpen(false)
    }
  }, [profileOpen])

  useEffect(() => {
    if (!profileOpen || !isActiveView) {
      return undefined
    }

    // Function: handlePointerDown
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setProfileOpen(false)
        setOrgMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [profileOpen, isActiveView, setProfileOpen, setOrgMenuOpen])

  // Function: onCurrencyChange
  const onCurrencyChange = async (currency) => {
    if (isUpdatingCurrency) {
      return
    }

    setIsUpdatingCurrency(true)
    try {
      await handleChangeCurrency(currency)
      setCurrencyMenuOpen(false)
    } finally {
      setIsUpdatingCurrency(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setProfileOpen((current) => !current)
          setOrgMenuOpen(false)
        }}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/6 bg-[var(--card)] text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        aria-label="Open profile details"
      >
        <UserCircleIcon className="h-6 w-6 text-[var(--muted)]" />
      </button>

      {profileOpen ? (
        <div className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-light text-white">
              {firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className={`font-light text-[var(--text)] ${mobile ? 'truncate text-sm' : 'text-sm'}`}>{firstName}</p>
              <p className="truncate text-xs text-slate-500">{currentUser?.email || text.noEmailFound}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl bg-[var(--card)] p-3 text-sm text-[var(--muted)]">
            {mobile ? null : (
              <div className="flex items-center justify-between">
                <span>{text.organization}</span>
                <span className="font-light text-[var(--text)]">{activeOrganization?.organizationName || text.noOrganizationYet}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span>{text.workspaceStatus}</span>
              <span className="inline-flex items-center gap-1 font-light text-emerald-600">
                <ShieldCheckIcon className="h-4 w-4" />
                {text.active}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <button
              type="button"
              onClick={() => setCurrencyMenuOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span>{text.changeCurrency}</span>
              <span className="inline-flex items-center gap-2 font-light text-[var(--text)]">
                <span className="currency-symbol">{activeCurrency?.symbol || getCurrencyByCode(activeCurrency?.code || 'USD').symbol}</span>
                <ChevronDownIcon className={`h-4 w-4 transition ${currencyMenuOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {currencyMenuOpen ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CURRENCIES.map((currency) => {
                  const isSelected = activeCurrency?.code === currency.code

                  return (
                    <button
                      key={currency.code}
                      type="button"
                      disabled={isUpdatingCurrency}
                      onClick={() => onCurrencyChange(currency)}
                      className={`relative flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-slate-200 bg-white text-[var(--text)] hover:border-primary-200 hover:bg-slate-100'
                      } ${isUpdatingCurrency ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-light">{currency.code}</p>
                        <p className="text-xs text-slate-500"><span className="currency-symbol">{currency.symbol}</span></p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-light">
                        <span>{currency.symbol}</span>
                      </div>
                      {isSelected ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-2 right-3 h-2.5 w-2.5 rounded-full bg-primary-600 ring-2 ring-[var(--card)]"
                        />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex items-center gap-2">
              <GlobeAltIcon className="h-4 w-4 text-primary-600" />
              <p className="text-sm font-light text-[var(--text)]">{text.languageLabel}</p>
            </div>
            <LanguageRow language={language} setLanguage={setLanguage} text={text} />
          </div>

          <button type="button" onClick={handleLogout} className="mt-4 w-full rounded-xl px-3 py-3 text-left text-sm font-light text-rose-600 transition hover:bg-rose-50">
            {text.logout}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function DashboardHeader({
  activeOrganization,
  activeOrgId,
  activeCurrency,
  currentUser,
  firstName,
  language,
  setLanguage,
  text,
  organizations,
  orgMenuOpen,
  profileOpen,
  setOrgMenuOpen,
  setProfileOpen,
  handleSwitchOrg,
  handleCreateNewOrg,
  handleLogout,
  handleChangeCurrency,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/6/80 bg-[var(--card)]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-10 sm:px-12 lg:px-16">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="PocketFlow Logo" className="h-11 w-11 object-contain" />
            <div>
              <p className="text-[13px] uppercase tracking-[0.28em] text-slate-500">PocketFlow</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 sm:gap-4 md:flex">
            <OrganizationMenu
              activeOrgId={activeOrgId}
              activeOrganization={activeOrganization}
              organizations={organizations}
              orgMenuOpen={orgMenuOpen}
              setOrgMenuOpen={setOrgMenuOpen}
              setProfileOpen={setProfileOpen}
              handleSwitchOrg={handleSwitchOrg}
              handleCreateNewOrg={handleCreateNewOrg}
              text={text}
            />

            <ProfileMenu
              currentUser={currentUser}
              firstName={firstName}
              activeOrganization={activeOrganization}
              activeCurrency={activeCurrency}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              setOrgMenuOpen={setOrgMenuOpen}
              language={language}
              setLanguage={setLanguage}
              handleLogout={handleLogout}
              handleChangeCurrency={handleChangeCurrency}
              text={text}
            />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <OrganizationMenu
              activeOrgId={activeOrgId}
              activeOrganization={activeOrganization}
              organizations={organizations}
              orgMenuOpen={orgMenuOpen}
              setOrgMenuOpen={setOrgMenuOpen}
              setProfileOpen={setProfileOpen}
              handleSwitchOrg={handleSwitchOrg}
              handleCreateNewOrg={handleCreateNewOrg}
              text={text}
              mobile
            />

            <ProfileMenu
              currentUser={currentUser}
              firstName={firstName}
              activeOrganization={activeOrganization}
              activeCurrency={activeCurrency}
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              setOrgMenuOpen={setOrgMenuOpen}
              language={language}
              setLanguage={setLanguage}
              handleLogout={handleLogout}
              handleChangeCurrency={handleChangeCurrency}
              text={text}
              mobile
            />
          </div>
        </div>
      </div>
    </header>
  )
}