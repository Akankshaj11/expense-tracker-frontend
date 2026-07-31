// Repo file header
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Layers,
  Settings,
  ShieldCheck,
  Terminal,
  LogOut,
  UserCheck,
  UserX,
  Key,
  Trash2,
  Lock,
  Search,
  Filter,
  Eye,
  Menu,
  X,
  Activity,
  Server,
  Database,
  RefreshCw,
  Sun,
  Moon,
  ArrowRight,
  Plus,
  CreditCard
} from 'lucide-react'
import logo from '../../assets/logo.png'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // API Data states
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    public_registration: true,
    rate_limit_enabled: true
  })

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [txnsLoading, setTxnsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Search & filter states
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')

  // Subscription management states
  const [subscriptions, setSubscriptions] = useState([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [subSearch, setSubSearch] = useState('')
  const [subPlanFilter, setSubPlanFilter] = useState('')
  const [subStatusFilter, setSubStatusFilter] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showEditSubModal, setShowEditSubModal] = useState(false)
  const [upgradeForm, setUpgradeForm] = useState({
    plan_id: 'pro',
    subscription_status: 'active',
    payment_status: 'paid',
    subscription_start: new Date().toISOString().split('T')[0],
    subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  // Modals / Details
  const [selectedUser, setSelectedUser] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resetPasswordVal, setResetPasswordVal] = useState('')

  // Create User form state
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  })

  // Cooldown / Success notifications
  const [toast, setToast] = useState(null)

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Token verify & API callers
  const getAdminHeaders = () => {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      navigate('/admin/login')
      return {}
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }

  const adminFetch = async (endpoint, options = {}) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const headers = getAdminHeaders()
    if (!headers.Authorization) return null

    try {
      const response = await fetch(`${apiBaseUrl}/admin${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {})
        }
      })

      const data = await response.json().catch(() => null)

      if (response.status === 401) {
        // Expired admin JWT
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        navigate('/admin/login')
        return null
      }

      if (!response.ok) {
        throw new Error(data?.message || 'API request failed')
      }

      return data
    } catch (e) {
      triggerToast(e.message, 'error')
      return null
    }
  }

  // Fetch functions
  const fetchStats = async () => {
    setStatsLoading(true)
    const data = await adminFetch('/stats')
    if (data) setStats(data.data)
    setStatsLoading(false)
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    const searchParams = new URLSearchParams()
    if (userSearch) searchParams.append('search', userSearch)
    if (userFilter) searchParams.append('status', userFilter)
    
    const data = await adminFetch(`/users?${searchParams.toString()}`)
    if (data) setUsers(Array.isArray(data.data) ? data.data : [])
    setUsersLoading(false)
  }

  const fetchTransactions = async () => {
    setTxnsLoading(true)
    const data = await adminFetch('/transactions')
    if (data) setTransactions(data.data || [])
    setTxnsLoading(false)
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    const data = await adminFetch('/audit-logs')
    if (data) setAuditLogs(data.data || [])
    setLogsLoading(false)
  }

  const fetchSubscriptions = async () => {
    setSubsLoading(true)
    const searchParams = new URLSearchParams()
    if (subSearch) searchParams.append('search', subSearch)
    if (subPlanFilter) searchParams.append('plan_id', subPlanFilter)
    if (subStatusFilter) searchParams.append('status', subStatusFilter)

    const data = await adminFetch(`/subscriptions?${searchParams.toString()}`)
    if (data) setSubscriptions(Array.isArray(data.data) ? data.data : [])
    setSubsLoading(false)
  }

  const handleRenewSubscription = async (userId) => {
    setActionLoading(true)
    const data = await adminFetch(`/subscriptions/${userId}/renew`, { method: 'POST' })
    if (data) {
      triggerToast('Subscription renewed successfully')
      fetchSubscriptions()
      fetchStats()
    }
    setActionLoading(false)
  }

  const handleCancelSubscription = async (userId) => {
    if (!window.confirm('Are you sure you want to cancel this user\'s subscription?')) return
    setActionLoading(true)
    const data = await adminFetch(`/subscriptions/${userId}/cancel`, { method: 'POST' })
    if (data) {
      triggerToast('Subscription cancelled successfully')
      fetchSubscriptions()
      fetchStats()
    }
    setActionLoading(false)
  }

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    const data = await adminFetch(`/subscriptions/${selectedUser._id}`, {
      method: 'PUT',
      body: JSON.stringify(upgradeForm)
    })
    if (data) {
      triggerToast('Subscription updated successfully')
      setShowUpgradeModal(false)
      fetchSubscriptions()
      fetchStats()
    }
    setActionLoading(false)
  }

  const fetchSettings = async () => {
    const data = await adminFetch('/settings')
    if (data) setSettings(data.data)
  }

  // Lifecycle
  useEffect(() => {
    // Force Dark Mode on Body for Admin panel
    const body = document.body
    if (isDarkMode) {
      body.classList.add('dark')
      body.classList.remove('theme-light-violet')
    } else {
      body.classList.remove('dark')
      body.classList.add('theme-light-violet')
    }
  }, [isDarkMode])

  useEffect(() => {
    fetchStats()
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
  }, [activeTab, userFilter])

  useEffect(() => {
    if (activeTab === 'subscriptions') fetchSubscriptions()
  }, [activeTab, subPlanFilter, subStatusFilter])

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions()
    if (activeTab === 'logs') fetchLogs()
    if (activeTab === 'dashboard') fetchStats()
  }, [activeTab])

  // User Actions
  const handleCreateUser = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    const data = await adminFetch('/users', {
      method: 'POST',
      body: JSON.stringify(createUserForm)
    })
    if (data) {
      triggerToast('User created successfully')
      setShowCreateModal(false)
      setCreateUserForm({ email: '', password: '', name: '', role: 'user' })
      fetchUsers()
      fetchStats()
    }
    setActionLoading(false)
  }

  const handleUpdateRole = async (user, role) => {
    setActionLoading(true)
    const data = await adminFetch(`/users/${user._id}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
    if (data) {
      triggerToast(`User role updated to ${role}`)
      fetchUsers()
    }
    setActionLoading(false)
  }

  const handleToggleSuspend = async (user) => {
    setActionLoading(true)
    const isSuspended = user.status === 'suspended'
    const endpoint = `/users/${user._id}/${isSuspended ? 'unsuspend' : 'suspend'}`
    const data = await adminFetch(endpoint, { method: 'POST' })
    if (data) {
      triggerToast(`User ${isSuspended ? 'unsuspended' : 'suspended'} successfully`)
      fetchUsers()
      fetchStats()
    }
    setActionLoading(false)
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!resetPasswordVal) return
    setActionLoading(true)
    const data = await adminFetch(`/users/${selectedUser._id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password: resetPasswordVal })
    })
    if (data) {
      triggerToast('Password reset successfully')
      setShowResetModal(false)
      setResetPasswordVal('')
    }
    setActionLoading(false)
  }

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${user.email}? This action is irreversible.`)) return
    setActionLoading(true)
    const data = await adminFetch(`/users/${user._id}`, { method: 'DELETE' })
    if (data) {
      triggerToast('User account deleted permanently')
      fetchUsers()
      fetchStats()
    }
    setActionLoading(false)
  }

  // IMPERSONATE FLOW
  const handleStartImpersonate = async (user) => {
    setActionLoading(true)
    const data = await adminFetch(`/impersonate/start/${user._id}`, { method: 'POST' })
    if (data && data.data) {
      const payload = data.data
      
      // Preserve admin state
      localStorage.setItem('adminAccessToken', localStorage.getItem('adminAccessToken'))
      localStorage.setItem('adminRefreshToken', localStorage.getItem('adminRefreshToken'))
      
      // Overwrite primary active token
      localStorage.setItem('accessToken', payload.accessToken)
      localStorage.setItem('refreshToken', payload.refreshToken)
      localStorage.setItem('currentUser', JSON.stringify(payload.user))
      
      localStorage.setItem('isImpersonating', 'true')
      localStorage.setItem('impersonatedUserEmail', user.email)
      
      triggerToast(`Entering impersonation session for ${user.email}`)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    }
    setActionLoading(false)
  }

  const handleSaveSettings = async (newSettings) => {
    const data = await adminFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings)
    })
    if (data) {
      setSettings(data.data)
      triggerToast('Platform settings updated successfully')
    }
  }

  const handleLogout = async () => {
    await adminFetch('/logout', { method: 'POST' })
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('adminCurrentUser')
    localStorage.removeItem('isAdmin')
    navigate('/admin/login')
  }

  return (
    <div className={`h-screen overflow-hidden flex flex-col md:flex-row ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition duration-200`}>
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[9999] px-6 py-3 rounded-xl border text-sm font-light shadow-xl transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : 'bg-slate-900/90 border-purple-500/30 text-slate-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Mobile Top Navigation */}
      <div className={`md:hidden flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="PocketFlow Logo" className="h-8 w-8 object-contain" />
          <span className="font-bold text-sm bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent">PocketFlow Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 border-r shrink-0 flex flex-col justify-between p-6 transition-all duration-300 ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="hidden md:flex items-center gap-3">
            <img src={logo} alt="PocketFlow" className="h-9 w-9 object-contain bg-white/10 p-1.5 rounded-xl border border-white/5" />
            <div>
              <div className="font-bold text-sm bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">PocketFlow</div>
              <div className="text-[10px] text-slate-400 font-light">Super Admin Room</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Overview', icon: Layers },
              { id: 'users', label: 'User Directory', icon: Users },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
              { id: 'transactions', label: 'All Transactions', icon: Activity },
              { id: 'logs', label: 'Audit Trail', icon: Terminal },
              { id: 'settings', label: 'System Control', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400'
                      : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          {/* Light/Dark Toggle */}
          <div className="flex items-center justify-between text-xs font-light text-slate-400 px-2">
            <span>Theme Configuration</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-lg border transition ${
                isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
          </div>

          {/* Return standard user dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-light transition ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Client Workspace
            <ArrowRight className="h-3 w-3" />
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 text-xs font-medium transition"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Overview Dashboard</h2>
                <p className="text-xs font-light text-slate-400 mt-1">Platform analytics and service node checkups</p>
              </div>
              <button
                onClick={fetchStats}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-800 rounded-xl bg-slate-900/50 hover:bg-slate-900 text-xs text-slate-300 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
                Reload Stats
              </button>
            </div>

            {statsLoading && !stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : (
              stats && (
                <div className="space-y-8">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Accounts', value: stats.totalUsers, desc: 'Registered on platform', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
                      { label: 'Monthly Recurring Revenue', value: `₹${(stats.mrr || 0).toLocaleString()}`, desc: 'Total recurring billing', icon: CreditCard, color: 'text-yellow-500 bg-yellow-500/10' },
                      { label: 'Total Subscribers', value: stats.subscribedUsers || 0, desc: 'Pro & Enterprise tiers', icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
                      { label: 'Expiring Soon', value: stats.expiringSoonCount || 0, desc: 'Expiring in next 7 days', icon: Activity, color: 'text-rose-500 bg-rose-500/10' },
                      { label: 'Free Users', value: stats.freePlanCount || 0, desc: 'Users on standard plan', icon: Users, color: 'text-slate-400 bg-slate-500/10' },
                      { label: 'Pro Users', value: stats.proPlanCount || 0, desc: '₹299/mo premium tier', icon: CreditCard, color: 'text-indigo-500 bg-indigo-500/10' },
                      { label: 'Enterprise Users', value: stats.enterprisePlanCount || 0, desc: '₹999/mo business tier', icon: Layers, color: 'text-pink-500 bg-pink-500/10' },
                      { label: 'Active / Expired Subs', value: `${stats.activeSubCount || 0} / ${stats.expiredSubCount || 0}`, desc: 'Active vs expired plans', icon: ShieldCheck, color: 'text-teal-500 bg-teal-500/10' },
                    ].map((card, i) => {
                      const Icon = card.icon
                      return (
                        <div key={i} className="bg-slate-900/40 border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                            <div className="text-xl font-bold tracking-tight">{card.value}</div>
                            <div className="text-[10px] text-slate-500 font-light">{card.desc}</div>
                          </div>
                          <div className={`p-3 rounded-xl ${card.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Infrastructure Health Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Database Health Card */}
                    <div className="bg-slate-900/40 border border-slate-800/70 p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Database className="h-4 w-4 text-purple-500" />
                        Infrastructure Memory
                      </h3>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-light text-slate-400">Database Size</span>
                        <span className="text-sm font-semibold">{stats.databaseStorage}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-light text-slate-400">Server Latency</span>
                        <span className="text-sm font-semibold text-emerald-400">{stats.apiLatency}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-light text-slate-400">Last Backup Node</span>
                        <span className="text-xs text-slate-300">{stats.lastBackupTime}</span>
                      </div>
                    </div>

                    {/* API and Node Status */}
                    <div className="bg-slate-900/40 border border-slate-800/70 p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Server className="h-4 w-4 text-emerald-500" />
                        Platform Node Status
                      </h3>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-light text-slate-400">Main Gateway Node</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                          {stats.serverStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-light text-slate-400">Public Registrations</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          settings.public_registration ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {settings.public_registration ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-light text-slate-400">Platform Access Triage</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          settings.maintenance_mode ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {settings.maintenance_mode ? 'MAINTENANCE MODE' : 'OPERATIONAL'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats Chart mockup using native SVG */}
                    <div className="bg-slate-900/40 border border-slate-800/70 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operational Traffic Load</h3>
                        <span className="text-[10px] text-slate-500 font-light">Mocked monthly activity overview</span>
                      </div>
                      <div className="h-24 w-full flex items-end justify-between gap-1.5 pt-4">
                        {[40, 25, 60, 45, 80, 55, 95, 70, 85, 65, 90, 100].map((height, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full bg-purple-500/30 rounded-t-sm hover:bg-purple-500 transition-all duration-200" style={{ height: `${height * 0.7}px` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 2: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">User Directory</h2>
                <p className="text-xs font-light text-slate-400 mt-1">Manage user account statuses, passwords, and permissions</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-purple-900/20"
              >
                <Plus className="h-4 w-4" />
                Add New User
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user accounts by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <select
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value)
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Users List Table */}
            {usersLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-900/30 rounded-xl animate-pulse border border-slate-800/40" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">No user accounts found matching query</p>
                <p className="text-xs text-slate-500 mt-1 font-light">Try adjusting your filters or search keywords</p>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-light">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="px-6 py-4">Identity</th>
                      <th className="px-6 py-4">Verification</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {(Array.isArray(users) ? users : []).map((user) => (
                      <tr key={user._id} className="hover:bg-slate-900/20">
                        {/* Name/Email */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-200">{user.name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-slate-400 font-light">{user.email}</div>
                          </div>
                        </td>
                        {/* Email Verified status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            user.email_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {user.email_verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        {/* Role selection dropdown */}
                        <td className="px-6 py-4">
                          <select
                            disabled={user.role === 'super_admin' && users.filter(u => u.role === 'super_admin').length <= 1}
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                          >
                            <option value="user">User</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        {/* Account Status toggle */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            user.status === 'suspended' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {user.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        {/* Date Registered */}
                        <td className="px-6 py-4 text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        {/* User Action buttons */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2.5">
                            {/* Profile Details */}
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowProfileModal(true)
                              }}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                              title="View full details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowResetModal(true)
                              }}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                              title="Reset security password"
                            >
                              <Key className="h-4 w-4" />
                            </button>

                            {/* Suspend/Unsuspend */}
                            <button
                              disabled={user.role === 'super_admin'}
                              onClick={() => handleToggleSuspend(user)}
                              className={`p-1.5 rounded-lg transition disabled:opacity-30 ${
                                user.status === 'suspended'
                                  ? 'hover:bg-emerald-950/20 text-emerald-500'
                                  : 'hover:bg-red-950/20 text-red-400'
                              }`}
                              title={user.status === 'suspended' ? 'Unsuspend Account' : 'Suspend Account'}
                            >
                              {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </button>

                            {/* Impersonation action */}
                            <button
                              disabled={user.status === 'suspended' || user.role === 'super_admin'}
                              onClick={() => handleStartImpersonate(user)}
                              className="px-2 py-1 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-400 rounded-lg text-[10px] font-medium disabled:opacity-30"
                              title="Impersonate user session"
                            >
                              Impersonate
                            </button>

                            {/* Delete User */}
                            <button
                              disabled={user.role === 'super_admin'}
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 hover:bg-red-950/20 text-red-500/60 hover:text-red-400 rounded-lg transition disabled:opacity-30"
                              title="Permanently Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBSCRIPTIONS MANAGEMENT */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Subscription Management</h2>
              <p className="text-xs font-light text-slate-400 mt-1">Manage user subscription tiers, plans status, and renewal actions</p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search accounts by name or email..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSubscriptions()}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <select
                  value={subPlanFilter}
                  onChange={(e) => setSubPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {subsLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-900/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
                <CreditCard className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">No subscriptions found matching query</p>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-light">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Current Plan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Expiry</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {subscriptions.map((user) => {
                      const hasPremium = user.plan_id && user.plan_id !== 'free'
                      const isExpired = user.subscription_status === 'expired'
                      const isCancelled = user.subscription_status === 'cancelled'
                      
                      return (
                        <tr key={user._id} className="hover:bg-slate-900/20">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-200">{user.name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              user.plan_id === 'enterprise' ? 'bg-pink-500/10 text-pink-400' :
                              user.plan_id === 'pro' ? 'bg-indigo-500/10 text-indigo-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {user.plan_id ? user.plan_id.toUpperCase() : 'FREE'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                              user.subscription_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                              user.subscription_status === 'expired' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {user.subscription_status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {user.subscription_end ? new Date(user.subscription_end).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              user.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                              user.payment_status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                              user.payment_status === 'failed' ? 'bg-red-500/10 text-red-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {user.payment_status || 'PAID'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Upgrade/Downgrade Button */}
                              {user.plan_id === 'free' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setUpgradeForm({
                                      plan_id: 'pro',
                                      subscription_status: 'active',
                                      payment_status: 'paid',
                                      subscription_start: new Date().toISOString().split('T')[0],
                                      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                    })
                                    setShowUpgradeModal(true)
                                  }}
                                  className="px-2 py-1 bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 rounded-lg text-[10px] font-medium"
                                >
                                  Upgrade
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setUpgradeForm({
                                      plan_id: 'free',
                                      subscription_status: 'active',
                                      payment_status: 'paid',
                                      subscription_start: '',
                                      subscription_end: ''
                                    })
                                    setShowUpgradeModal(true)
                                  }}
                                  className="px-2 py-1 bg-yellow-600/10 border border-yellow-500/20 hover:bg-yellow-600/20 text-yellow-400 rounded-lg text-[10px] font-medium"
                                >
                                  Downgrade
                                </button>
                              )}

                              {/* Renew Button */}
                              {hasPremium && (
                                <button
                                  type="button"
                                  onClick={() => handleRenewSubscription(user._id)}
                                  className="px-2 py-1 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-400 rounded-lg text-[10px] font-medium"
                                >
                                  Renew
                                </button>
                              )}

                              {/* Cancel Button */}
                              {hasPremium && !isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelSubscription(user._id)}
                                  className="px-2 py-1 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 rounded-lg text-[10px] font-medium"
                                >
                                  Cancel
                                </button>
                              )}

                              {/* Edit details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setUpgradeForm({
                                    plan_id: user.plan_id || 'free',
                                    subscription_status: user.subscription_status || 'active',
                                    payment_status: user.payment_status || 'paid',
                                    subscription_start: user.subscription_start ? new Date(user.subscription_start).toISOString().split('T')[0] : '',
                                    subscription_end: user.subscription_end ? new Date(user.subscription_end).toISOString().split('T')[0] : ''
                                  })
                                  setShowEditSubModal(true)
                                }}
                                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                                title="Edit manually"
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRANSACTIONS MONITORING */}
        {activeTab === 'transactions' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">System Transactions</h2>
              <p className="text-xs font-light text-slate-400 mt-1">Cross-workspace audit of monetary tracking files</p>
            </div>

            {txnsLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-900/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
                <Activity className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">No operational transactions logged yet</p>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-light">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Context Note</th>
                      <th className="px-6 py-4">Flow Type</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Logged Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.map((txn) => {
                      const amount = Number(txn.amount || 0)
                      const isIncoming = String(txn.direction || '').toLowerCase() === 'in'
                      return (
                        <tr key={txn._id} className="hover:bg-slate-900/20">
                          <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">{txn._id}</td>
                          <td className="px-6 py-4 font-medium text-slate-200">{txn.note || 'No note details'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                              isIncoming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {isIncoming ? 'Inflow' : 'Outflow'}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-semibold text-sm ${isIncoming ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isIncoming ? '+' : '-'}${Math.abs(amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {txn.createdAt ? new Date(txn.createdAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOG TRAIL */}
        {activeTab === 'logs' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Administrative Logs</h2>
              <p className="text-xs font-light text-slate-400 mt-1">Structured history trail of all panel operations</p>
            </div>

            {logsLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-900/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
                <Terminal className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">Audit timeline is currently empty</p>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-x-auto">
                <table className="w-full border-collapse text-left text-[11px] font-light">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Operator Email</th>
                      <th className="px-6 py-4">Action Event</th>
                      <th className="px-6 py-4">Target Detail</th>
                      <th className="px-6 py-4">Connection Specs</th>
                      <th className="px-6 py-4 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-900/20">
                        <td className="px-6 py-4 text-slate-400 font-light">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200">
                          {log.admin_email || 'Unauthenticated'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-purple-400">{log.action}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {log.target_user_email ? (
                            <div>
                              <span>{log.target_user_email}</span>
                              {log.target_user_id && <span className="text-[9px] text-slate-500 block font-mono">{log.target_user_id}</span>}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-light italic">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          <div>
                            <span className="font-mono text-[10px]">{log.ip_address}</span>
                            <span className="text-[9px] text-slate-500 block font-light truncate max-w-[150px]" title={log.user_agent}>
                              {log.user_agent}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {log.success ? 'Success' : 'Failure'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SYSTEM CONTROL SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-fadeIn max-w-2xl">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Platform System Control</h2>
              <p className="text-xs font-light text-slate-400 mt-1">Configure platform-wide features and entry thresholds</p>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8 space-y-6">
              {/* Toggle 1: Maintenance Mode */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200">System Maintenance Lockout</h3>
                  <p className="text-xs font-light text-slate-400 leading-relaxed">
                    Instantly block user entry to standard dashboards, placing the workspace portal in emergency maintenance mode.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.maintenance_mode ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Divider */}
              <hr className="border-slate-800" />

              {/* Toggle 2: Public Registration */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200">New User Public Signup</h3>
                  <p className="text-xs font-light text-slate-400 leading-relaxed">
                    Toggle to disable registration nodes, preventing new accounts from signing up to the service.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSettings({ ...settings, public_registration: !settings.public_registration })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.public_registration ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.public_registration ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Divider */}
              <hr className="border-slate-800" />

              {/* Toggle 3: Rate Limiting */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200">Rate Limiter Nodes</h3>
                  <p className="text-xs font-light text-slate-400 leading-relaxed">
                    Protect API servers from load congestion by throttling excessive user client queries.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSettings({ ...settings, rate_limit_enabled: !settings.rate_limit_enabled })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.rate_limit_enabled ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.rate_limit_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: VIEW USER PROFILE PROFILE DETAILS */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-6 text-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Identity Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Platform parameters for {selectedUser.email}</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Account ID</span>
                <span className="font-mono text-right truncate max-w-[180px]">{selectedUser._id}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Display Name</span>
                <span className="text-right font-medium">{selectedUser.name || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Email Address</span>
                <span className="text-right font-medium">{selectedUser.email}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Verification state</span>
                <span className="text-right font-medium text-emerald-400">{selectedUser.email_verified ? 'VERIFIED' : 'PENDING'}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Access Role</span>
                <span className="text-right font-medium uppercase text-purple-400">{selectedUser.role}</span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Account status</span>
                <span className={`text-right font-medium ${selectedUser.status === 'suspended' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedUser.status ? selectedUser.status.toUpperCase() : 'ACTIVE'}
                </span>
              </div>
              <div className="grid grid-cols-2 py-2 border-b border-slate-850">
                <span className="text-slate-400">Registration Date</span>
                <span className="text-right">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 py-2">
                <span className="text-slate-400">Last Login activity</span>
                <span className="text-right">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-semibold"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleResetPasswordSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-5 text-slate-200">
            <div>
              <h3 className="text-lg font-bold">Reset Password</h3>
              <p className="text-xs text-slate-400 mt-1">Configure new access key credentials for {selectedUser.email}</p>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-400 mb-2">New Password Key</label>
              <input
                type="text"
                required
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                placeholder="SecureKey#123"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false)
                  setResetPasswordVal('')
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CREATE USER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleCreateUser} className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-4 text-slate-200">
            <div>
              <h3 className="text-lg font-bold">Create User Account</h3>
              <p className="text-xs text-slate-400 mt-1">Provision a new user account profile manually</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-2">Email Identity</label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  placeholder="name@email.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-2">Display Name</label>
                <input
                  type="text"
                  value={createUserForm.name}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-2">Access Key (Password)</label>
                <input
                  type="text"
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  placeholder="TemporaryPass@123"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-2">Access Role</label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-lg shadow-purple-900/10"
              >
                Provision User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: UPGRADE / DOWNGRADE PLAN */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleUpgradeSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-4 text-slate-200">
            <div>
              <h3 className="text-lg font-bold">Manage Subscription Tier</h3>
              <p className="text-xs text-slate-400 mt-1">Configure subscription level for {selectedUser.email}</p>
            </div>

            <div>
              <label htmlFor="modal-plan" className="block text-[10px] font-medium text-slate-400 mb-2">Select Plan Tier</label>
              <select
                id="modal-plan"
                value={upgradeForm.plan_id}
                onChange={(e) => {
                  const val = e.target.value
                  setUpgradeForm({
                    ...upgradeForm,
                    plan_id: val,
                    subscription_start: val === 'free' ? '' : new Date().toISOString().split('T')[0],
                    subscription_end: val === 'free' ? '' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  })
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="free">Free (₹0)</option>
                <option value="pro">Pro (₹299/mo)</option>
                <option value="enterprise">Enterprise (₹999/mo)</option>
              </select>
            </div>

            {upgradeForm.plan_id !== 'free' && (
              <>
                <div>
                  <label htmlFor="modal-payment" className="block text-[10px] font-medium text-slate-400 mb-2">Payment Status</label>
                  <select
                    id="modal-payment"
                    value={upgradeForm.payment_status}
                    onChange={(e) => setUpgradeForm({ ...upgradeForm, payment_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-expiry" className="block text-[10px] font-medium text-slate-400 mb-2">Plan Expiry Date</label>
                  <input
                    id="modal-expiry"
                    type="date"
                    required
                    value={upgradeForm.subscription_end}
                    onChange={(e) => setUpgradeForm({ ...upgradeForm, subscription_end: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Apply Plan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: EDIT SUBSCRIPTION (MANUAL OVERRIDES) */}
      {showEditSubModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleUpgradeSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-4 text-slate-200">
            <div>
              <h3 className="text-lg font-bold">Manual Override Details</h3>
              <p className="text-xs text-slate-400 mt-1">Directly adjust database parameters for {selectedUser.email}</p>
            </div>

            <div>
              <label htmlFor="edit-plan" className="block text-[10px] font-medium text-slate-400 mb-2">Plan ID</label>
              <select
                id="edit-plan"
                value={upgradeForm.plan_id}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, plan_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-[10px] font-medium text-slate-400 mb-2">Subscription Status</label>
              <select
                id="edit-status"
                value={upgradeForm.subscription_status}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, subscription_status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="edit-payment" className="block text-[10px] font-medium text-slate-400 mb-2">Payment Status</label>
              <select
                id="edit-payment"
                value={upgradeForm.payment_status}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, payment_status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-start" className="block text-[10px] font-medium text-slate-400 mb-2">Start Date</label>
                <input
                  id="edit-start"
                  type="date"
                  value={upgradeForm.subscription_start}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, subscription_start: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-expiry" className="block text-[10px] font-medium text-slate-400 mb-2">Expiry Date</label>
                <input
                  id="edit-expiry"
                  type="date"
                  value={upgradeForm.subscription_end}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, subscription_end: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditSubModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Save Overrides
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
