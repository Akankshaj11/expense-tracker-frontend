// Repo file header
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
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
function ProfileMenu({ currentUser, firstName, activeOrganization, activeCurrency, profileOpen, setProfileOpen, setOrgMenuOpen, language, setLanguage, handleLogout, handleChangeCurrency, text, mobile = false, onUpdateProfilePic, onUpdateUser, organizations, onUpdateOrganizations, setShowUpgradeModal }) {
  const containerRef = useRef(null)
  const isDesktop = useIsDesktop()
  const isActiveView = mobile ? !isDesktop : isDesktop
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false)
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Profile fields editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState(currentUser?.name || '')
  const [editAddress, setEditAddress] = useState(currentUser?.address || '')
  const [editMobile, setEditMobile] = useState(currentUser?.mobile || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Change Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [showMembersPopup, setShowMembersPopup] = useState(false)
  const [activeMemberMenuEmail, setActiveMemberMenuEmail] = useState(null)

  const isOwner = activeOrganization && (
    (currentUser?.id && String(currentUser.id) === String(activeOrganization.ownerId)) ||
    (currentUser?._id && String(currentUser._id) === String(activeOrganization.ownerId))
  );

  const handleRemoveMember = async (email) => {
    if (!window.confirm(`Are you sure you want to remove ${email}?`)) return
    try {
      const response = await apiRequest(`/organizations/${activeOrganization.id}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ email })
      })
      if (response?.success) {
        alert('Member removed successfully.')
        window.location.reload()
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member')
    }
  }

  const handleQuitOrganization = async () => {
    if (!window.confirm(`Are you sure you want to quit the "${activeOrganization.organizationName}" workspace?`)) return
    try {
      const response = await apiRequest(`/organizations/${activeOrganization.id}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ email: currentUser.email })
      })
      if (response?.success) {
        alert('You have left the workspace.')
        setShowMembersPopup(false)
        if (onUpdateOrganizations && organizations) {
          const nextOrgs = organizations.filter(o => o.id !== activeOrganization.id)
          onUpdateOrganizations(nextOrgs)
          
          const personal = nextOrgs.find(o => 
            (currentUser?.id && String(o.ownerId) === String(currentUser.id)) ||
            (currentUser?._id && String(o.ownerId) === String(currentUser?._id))
          ) || nextOrgs[0] || null;
          
          if (personal) {
            localStorage.setItem('organization', JSON.stringify(personal))
            localStorage.setItem('activeOrgId', personal.id)
            window.location.reload()
          } else {
            window.location.reload()
          }
        } else {
          window.location.reload()
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to quit organization')
    }
  }

  useEffect(() => {
    if (!isEditingProfile && currentUser) {
      setEditName(currentUser.name || '')
      setEditAddress(currentUser.address || '')
      setEditMobile(currentUser.mobile || '')
    }
  }, [currentUser, isEditingProfile])

  const handleProfileEditSubmit = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return setProfileError('Name is required')
    if (!editAddress.trim()) return setProfileError('Address is required')
    if (!editMobile.trim()) return setProfileError('Mobile number is required')

    setIsSavingProfile(true)
    setProfileError('')
    try {
      const payload = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          address: editAddress.trim(),
          mobile: editMobile.trim()
        })
      })
      const updatedUser = payload?.data?.user
      if (updatedUser) {
        if (onUpdateUser) onUpdateUser(updatedUser)
        setIsEditingProfile(false)
      } else {
        setProfileError('Failed to update profile details')
      }
    } catch (err) {
      console.error(err)
      setProfileError(err.message || 'Error updating profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!oldPassword) return setPasswordError('Current password is required')
    if (!newPassword) return setPasswordError('New password is required')
    if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match')

    setIsSavingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      })
      setPasswordSuccess('Password updated successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setIsChangingPassword(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (err) {
      console.error(err)
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setIsSavingPassword(false)
    }
  }

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
  useEffect(() => {
    if (profileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setCurrencyMenuOpen(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [profileOpen])

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

      {profileOpen && createPortal((
        <>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-[3px]">
          <div className="absolute inset-0" onClick={() => setProfileOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto modern-scrollbar bg-[var(--card)] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-2xl shadow-slate-200/50 dark:shadow-none text-[var(--text)] space-y-4"
          >
            
            {/* Modal Dialog Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-md font-semibold text-[var(--text)]">User Settings</h3>
              <button 
                type="button" 
                onClick={() => setProfileOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)]"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

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
                <p className="font-semibold text-[var(--text)] text-sm">{firstName}</p>
                <p className="truncate text-xs text-[var(--muted)]">{currentUser?.email || text.noEmailFound}</p>
              </div>
            </div>

          <div className="mt-4 space-y-3 rounded-2xl bg-[var(--bg-2)]/80 p-3 text-sm text-[var(--muted)]">
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

            {/* Active Plan Row */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Active Plan</span>
              <div className="flex items-center gap-1.5 font-light">
                <span className="font-bold text-slate-900 dark:text-white uppercase">
                  {currentUser?.plan_id || 'free'}
                </span>
                {setShowUpgradeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setShowUpgradeModal(true);
                    }}
                    className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-750 dark:hover:text-violet-300 hover:underline cursor-pointer"
                  >
                    (Plans)
                  </button>
                )}
              </div>
            </div>

            {activeOrganization && (
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5 text-xs">
                <span>Workspace Members</span>
                <button
                  type="button"
                  onClick={() => setShowMembersPopup(true)}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  See All Members
                </button>
              </div>
            )}
          </div>

          {/* Security & Password Row */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-[var(--bg-2)]/80 p-3 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsChangingPassword(true)
                setPasswordError('')
                setPasswordSuccess('')
              }}
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text)] text-left hover:underline"
            >
              <span>Security & Password</span>
              <span className="text-[10px] font-normal text-blue-600 dark:text-blue-400 cursor-pointer">
                Change Password
              </span>
            </button>
          </div>

          {/* Profile Fields View/Edit Section */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-[var(--bg-2)]/80 p-3 space-y-3 dark:border-white/5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">Profile Details</span>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile)
                  setProfileError('')
                }}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {profileError && (
              <p className="text-[10px] text-red-500 font-medium">{profileError}</p>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleProfileEditSubmit} className="space-y-3">
                <div>
                  <label htmlFor="edit-name-inp" className="block text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    id="edit-name-inp"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg)] border border-slate-200/60 dark:border-white/5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-mobile-inp" className="block text-[9px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Mobile Number</label>
                  <input
                    id="edit-mobile-inp"
                    type="text"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg)] border border-slate-200/60 dark:border-white/5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-address-inp" className="block text-[9px] font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Address</label>
                  <textarea
                    id="edit-address-inp"
                    required
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg)] border border-slate-200/60 dark:border-white/5 rounded-xl text-xs text-[var(--text)] focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <div className="space-y-2 text-xs text-[var(--muted)]">
                <div className="flex justify-between gap-2">
                  <span>Name</span>
                  <span className="font-medium text-[var(--text)] text-right">{currentUser?.name || 'Not filled'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Mobile</span>
                  <span className="font-medium text-[var(--text)] text-right">{currentUser?.mobile || 'Not filled'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Address</span>
                  <span className="font-medium text-[var(--text)] text-right max-w-[140px] truncate" title={currentUser?.address}>{currentUser?.address || 'Not filled'}</span>
                </div>
              </div>
            )}
          </div>



          <div className="rounded-2xl border border-slate-200 bg-[var(--bg-2)]/80 p-3">
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
                          : 'border-slate-200/60 dark:border-white/5 bg-[var(--bg)] text-[var(--text)] hover:border-primary-200 hover:bg-slate-100'
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

          <div className="mt-4 rounded-2xl border border-slate-200 bg-[var(--bg-2)]/80 p-3">
            <div className="mb-3 flex items-center gap-2">
              <GlobeAltIcon className="h-4 w-4 text-primary-600" />
              <p className="text-sm font-light text-[var(--text)]">{text.languageLabel}</p>
            </div>
            <LanguageRow language={language} setLanguage={setLanguage} text={text} />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-[var(--bg-2)]/80 dark:border-white/5 p-3">
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
                    : 'bg-[var(--bg)] border-slate-200/60 dark:border-white/5 text-[var(--text)] hover:opacity-85'
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
                    : 'bg-[var(--bg)] border-slate-200/60 dark:border-white/5 text-[var(--text)] hover:opacity-85'
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
        </motion.div>
      </div>

      {/* Workspace Members Modal Popup */}
      {showMembersPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-slate-800 dark:text-white">
          <div className="absolute inset-0" onClick={() => setShowMembersPopup(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 z-10 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Members</h4>
              <button
                type="button"
                onClick={() => setShowMembersPopup(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 pt-1 pb-6 max-h-60 overflow-y-auto modern-scrollbar pr-1.5 text-left">
              {/* Owner Item */}
              {activeOrganization?.ownerDetails && (
                <div className="flex items-center gap-3 py-1">
                  {activeOrganization.ownerDetails.profile_pic ? (
                    <img
                      src={activeOrganization.ownerDetails.profile_pic}
                      alt="Owner Profile"
                      className="h-8 w-8 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 text-xs font-semibold">
                      {activeOrganization.ownerDetails.name?.charAt(0).toUpperCase() || 'O'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {activeOrganization.ownerDetails.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {activeOrganization.ownerDetails.email} • Owner
                    </p>
                  </div>
                </div>
              )}
              
              {/* Members Iteration */}
              {activeOrganization?.members
                ?.filter(m => m.email?.toLowerCase() !== (activeOrganization?.ownerDetails?.email || '').toLowerCase())
                .map((m) => {
                  const isMemberMenuOpen = activeMemberMenuEmail === m.email;
                  return (
                    <div key={m.email} className="flex justify-between items-center gap-3 py-2 border-t border-slate-100 dark:border-white/5 relative">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {m.profile_pic ? (
                          <img
                            src={m.profile_pic}
                            alt="Member Profile"
                            className="h-8 w-8 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300 text-xs font-semibold">
                            {m.name?.charAt(0).toUpperCase() || 'M'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {m.email} • {m.accepted ? 'Member' : 'Pending Invite'}
                          </p>
                        </div>
                      </div>
                      
                      {isOwner && (
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveMemberMenuEmail(isMemberMenuOpen ? null : m.email)}
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-655 transition"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                          {isMemberMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-[205]" onClick={(e) => { e.stopPropagation(); setActiveMemberMenuEmail(null); }} />
                              <div className="absolute right-6 -top-2 z-[210] w-32 overflow-hidden rounded-xl border border-slate-100 bg-white dark:bg-[var(--card)] dark:border-white/5 shadow-xl py-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMember(m.email);
                                    }}
                                    className="flex w-full items-center px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition font-medium text-left"
                                  >
                                    Remove Member
                                  </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>

            {!isOwner && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={handleQuitOrganization}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-center"
                >
                  Quit Workspace
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Change Password Modal Popup */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-slate-800 dark:text-white">
          <div className="absolute inset-0" onClick={() => setIsChangingPassword(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 z-10 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Password</h3>
              <button 
                type="button" 
                onClick={() => setIsChangingPassword(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/10 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {passwordSuccess}
                </div>
              )}
              <div>
                <label htmlFor="chg-old" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  id="chg-old"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="chg-new" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  id="chg-new"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="chg-confirm" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="chg-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      </>),
      document.body
    )}
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
  onUpdateUser,
  onUpdateOrganizations,
  setShowUpgradeModal,
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
              onUpdateUser={onUpdateUser}
              organizations={organizations}
              onUpdateOrganizations={onUpdateOrganizations}
              setShowUpgradeModal={setShowUpgradeModal}
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
              onUpdateUser={onUpdateUser}
              organizations={organizations}
              onUpdateOrganizations={onUpdateOrganizations}
              setShowUpgradeModal={setShowUpgradeModal}
            />
          </div>
        </div>
      </div>
    </header>
  )
}