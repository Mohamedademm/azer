import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  Home, LayoutGrid, Users, UserPlus, Settings,
} from 'lucide-react'
import { clearAuth } from '@/utils/auth'
import userService from '@/services/userService'
import AppSidebar from '@/components/layout/AppSidebar'
import ThemeToggle from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/accueil',        label: 'Accueil',         Icon: Home },
  { to: '/admin/modules',        label: 'Modules',         Icon: LayoutGrid },
  { to: '/admin/accounts',       label: 'Comptes',         Icon: Users },
  { to: '/admin/create-account', label: 'Créer un compte', Icon: UserPlus },
  { to: '/admin/settings',       label: 'Paramètres',      Icon: Settings },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userInfo, setUserInfo] = useState({
    firstName: 'Admin', lastName: 'Principal', email: '', department: 'Direction'
  })

  useEffect(() => {
    let active = true
    userService.getProfile().then(res => {
      if (!active) return
      const p = res?.data || res
      setUserInfo({
        firstName: p?.firstName || 'Admin',
        lastName:  p?.lastName  || 'Principal',
        email:     p?.email     || '',
        department: p?.department || 'Direction',
      })
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const handleLogout = () => { clearAuth(); navigate('/login') }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AppSidebar
        accentColor="#6366f1"
        title="Azer ERP"
        subtitle="Administration"
        navItems={navItems}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        userInfo={userInfo}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={cn('main-content', collapsed && 'collapsed')}>
        {/* Sticky top header */}
        <header className="page-header-bar">
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
            onClick={() => setMobileOpen(o => !o)}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Header right */}
          <div className="flex items-center gap-2">
            <time
              dateTime={new Date().toISOString()}
              className="hidden sm:block text-xs text-[var(--fg-muted)] bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-medium"
            >
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              })}
            </time>
            <ThemeToggle />
          </div>
        </header>

        {/* Page outlet */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
