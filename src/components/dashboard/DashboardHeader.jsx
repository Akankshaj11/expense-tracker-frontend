// Repo file header
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline'
import { CURRENCIES, getCurrencyByCode } from '../../utils/currencies'
import logo from '../../assets/logo.png'
import { apiRequest } from '../../utils/api'

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
  const navigate = useNavigate()
  const [actionMenuOrgId, setActionMenuOrgId] = useState(null)

  const handleEditOrg = (org) => {
    if (org.id !== activeOrgId) {
      handleSwitchOrg(org.id)
    }
    setOrgMenuOpen(false)
    navigate('/manage-organization')
  }

  const handleDeleteOrg = async (org) => {
    if (organizations.length <= 1) {
      alert(text.mustHaveAtLeastOneOrg || 'You must have at least one organization.')
      return
    }

    const confirmMessage = `Are you sure you want to delete "${org.organizationName}"? All books and transactions inside will be deleted permanently.`
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const isMongoId = /^[a-f0-9]{24}$/.test(org.id)
      if (isMongoId) {
        await apiRequest(`/organizations/${org.id}`, {
          method: 'DELETE',
        })
      }

      // Update localStorage
      const nextOrgs = organizations.filter((item) => item.id !== org.id)
      localStorage.setItem('organizations', JSON.stringify(nextOrgs))

      // If we deleted the active organization, switch to another one
      if (activeOrgId === org.id) {
        const fallbackOrg = nextOrgs[0]
        localStorage.setItem('activeOrgId', fallbackOrg.id)
        localStorage.setItem('organization', JSON.stringify(fallbackOrg))
        handleSwitchOrg(fallbackOrg.id)
      } else {
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to delete organization: ' + (err?.message || err))
    }
  }

  useEffect(() => {
    if (!orgMenuOpen || !isActiveView) {
      return undefined
    }

    // Function: handlePointerDown
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOrgMenuOpen(false)
        setProfileOpen(false)
        setActionMenuOrgId(null)
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
          setActionMenuOrgId(null)
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
        <div className="absolute right-0 mt-3 w-72 overflow-visible rounded-2xl border border-slate-150 bg-white dark:border-white/6 dark:bg-[var(--card)] shadow-2xl shadow-slate-200/80 z-[100]">
          <div className="border-b border-slate-100 dark:border-white/4 px-4 py-3">
            <p className="text-sm font-light text-[var(--text)]">{text.organizationMenuTitle}</p>
            <p className="text-xs text-slate-500">{text.organizationMenuSubtitle}</p>
          </div>
          <div className="p-2 space-y-1">
            {organizations.length > 0 ? (
              organizations.map((organization) => (
                <div
                  key={organization.id}
                  className={`group/org-item flex w-full items-center justify-between rounded-xl px-3 py-2 transition relative ${
                    activeOrgId === organization.id ? 'bg-primary-50 dark:bg-primary-950/30' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/4'
                  }`}
                >
                  {/* Left side: Switch Active Action area */}
                  <div
                    onClick={() => {
                      handleSwitchOrg(organization.id)
                      setActionMenuOrgId(null)
                    }}
                    className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer"
                  >
                    {/* Activeness checkmark tick */}
                    <div className="shrink-0 w-4 flex justify-start">
                      {activeOrgId === organization.id ? (
                        <span className="text-primary-600 dark:text-primary-400 font-bold text-sm select-none">✓</span>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{organization.organizationName}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 truncate font-light">{(organization.description ? organization.description.split('|||')[0].trim() : '') || text.noDescription}</p>
                    </div>
                  </div>

                  {/* Right side: Actions menu trigger */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2 relative">

                    {/* Actions Menu Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActionMenuOrgId(actionMenuOrgId === organization.id ? null : organization.id)
                        }}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white transition"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>

                      {actionMenuOrgId === organization.id ? (
                        <div className="absolute right-0 top-7 z-[110] w-24 overflow-hidden rounded-xl border border-slate-150 bg-white dark:bg-[var(--card)] dark:border-white/6 shadow-xl py-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionMenuOrgId(null)
                              handleEditOrg(organization)
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/4 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionMenuOrgId(null)
                              handleDeleteOrg(organization)
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-[var(--card)] px-3 py-4 text-sm text-slate-500">{text.noOrganizationsFound}</div>
            )}
          </div>
          <div className="border-t border-slate-100 dark:border-white/4 p-2">
            <button
              type="button"
              onClick={handleCreateNewOrg}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-light text-primary-700 dark:text-primary-400 transition hover:bg-primary-50 dark:hover:bg-white/4"
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
function ProfileMenu({ currentUser, firstName, activeOrganization, activeCurrency, profileOpen, setProfileOpen, setOrgMenuOpen, language, setLanguage, handleLogout, handleChangeCurrency, text, mobile = false, onUpdateProfilePic }) {
  const containerRef = useRef(null)
  const isDesktop = useIsDesktop()
  const isActiveView = mobile ? !isDesktop : isDesktop
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const getThemeForCurrentUser = () => {
    if (currentUser && currentUser.email) {
      return localStorage.getItem(`selectedTheme_${currentUser.email}`) || 'light'
    }
    return 'light'
  }

  const [theme, setTheme] = useState(() => getThemeForCurrentUser())

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    if (currentUser && currentUser.email) {
      localStorage.setItem(`selectedTheme_${currentUser.email}`, newTheme)
    }
    const body = document.body
    if (newTheme === 'dark') {
      body.classList.remove('theme-light-violet')
      body.classList.add('dark')
    } else {
      body.classList.add('theme-light-violet')
      body.classList.remove('dark')
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      try {
        const payload = await apiRequest('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ profile_pic: base64String }),
        })
        const updatedUser = payload?.data?.user
        if (updatedUser && onUpdateProfilePic) {
          onUpdateProfilePic(updatedUser.profile_pic)
        }
      } catch (err) {
        console.error('Failed to update profile pic:', err)
        alert('Failed to update profile picture')
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }
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
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/6 bg-[var(--card)] overflow-hidden text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        aria-label="Open profile details"
      >
        {currentUser?.profile_pic ? (
          <img src={currentUser.profile_pic} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <UserCircleIcon className="h-6 w-6 text-[var(--muted)]" />
        )}
      </button>

      {profileOpen ? (
        <div className={panelClassName}>
          <div className="flex items-center gap-3">
            <div className="relative group h-12 w-12 flex-shrink-0">
              {currentUser?.profile_pic ? (
                <img src={currentUser.profile_pic} alt="Profile" className="h-12 w-12 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-light text-white">
                  {firstName.charAt(0)}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/45 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-light">
                {isUploading ? '...' : 'Edit'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
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

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/6 dark:bg-white/4 p-3">
            <div className="mb-3 flex items-center gap-2">
              {theme === 'light' ? (
                <SunIcon className="h-4 w-4 text-amber-500" />
              ) : (
                <MoonIcon className="h-4 w-4 text-indigo-400" />
              )}
              <p className="text-sm font-light text-[var(--text)]">Theme</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex-1 rounded-xl px-2 py-2 text-center text-xs font-light border transition ${
                  theme === 'light'
                    ? 'bg-primary-50 border-primary-200 text-primary-700 font-normal shadow-sm'
                    : 'bg-[var(--bg-2)] border-slate-200 dark:border-white/8 text-[var(--text)] hover:opacity-85'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 rounded-xl px-2 py-2 text-center text-xs font-light border transition ${
                  theme === 'dark'
                    ? 'bg-primary-50 border-primary-200 text-primary-700 font-normal shadow-sm'
                    : 'bg-[var(--bg-2)] border-slate-200 dark:border-white/8 text-[var(--text)] hover:opacity-85'
                }`}
              >
                Dark
              </button>
          </div>
        </div>

          {currentUser?.role === 'super_admin' ? (
            <Link
              to="/admin"
              className="mt-4 block w-full rounded-xl px-3 py-3 text-left text-sm font-light text-purple-600 hover:bg-purple-50/80 bg-purple-50/50 transition border border-purple-100 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/40"
            >
              Admin Control Room
            </Link>
          ) : null}

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
  onUpdateProfilePic,
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/6/80 bg-[var(--card)]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-10 sm:px-12 lg:px-16">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="PocketFlow Logo" className="h-8 w-8 object-contain" />
            <div>
              <div className="text-[18px] pt-1 text-blue-600 font-semibold">PocketFlow</div>
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
              onUpdateProfilePic={onUpdateProfilePic}
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
              onUpdateProfilePic={onUpdateProfilePic}
            />
          </div>
        </div>
      </div>
    </header>
  )
}