import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

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

function OrganizationMenu({ activeOrgId, activeOrganization, organizations, orgMenuOpen, setOrgMenuOpen, setProfileOpen, handleSwitchOrg, handleCreateNewOrg, text }) {
  return (
    <div className="relative">
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

function ProfileMenu({ currentUser, firstName, activeOrganization, activeCurrency, profileOpen, setProfileOpen, setOrgMenuOpen, language, setLanguage, handleLogout, text, mobile = false }) {
  const panelClassName = mobile
    ? 'absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-white/6 bg-[var(--card)] p-4 shadow-2xl shadow-slate-200/80'
    : 'absolute right-0 mt-3 w-72 rounded-2xl border border-white/6 bg-[var(--card)] p-4 shadow-2xl shadow-slate-200/80'

  return (
    <div className="relative">
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
              <span>{text.currency}</span>
              <span className="font-light text-[var(--text)]">{activeCurrency?.code || 'USD'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{text.workspaceStatus}</span>
              <span className="inline-flex items-center gap-1 font-light text-emerald-600">
                <ShieldCheckIcon className="h-4 w-4" />
                {text.active}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/6 bg-[var(--card)] p-3">
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
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/6/80 bg-[var(--card)]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-10 sm:px-12 lg:px-16">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 font-light text-white shadow-lg shadow-primary-500/20">
              FT
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">FinTrack</p>
              <p className="text-lg font-light text-[var(--text)]">Wallet App</p>
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
              text={text}
              mobile
            />
          </div>
        </div>
      </div>
    </header>
  )
}