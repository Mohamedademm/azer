import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, BarChart3, Crown, Package, Repeat2, Settings, Tags, Truck,
} from 'lucide-react'
import { useModuleAvailability } from '@/hooks/useModuleAvailability'
import ModuleDisabledView from '@/components/ModuleDisabledView'
import { clearAuth, getUserEmail, getUserRole } from '@/utils/auth'
import userService from '@/services/userService'
import AppSidebar from '@/components/layout/AppSidebar'
import ThemeToggle from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

const ACCENT = '#6366f1' // Indigo — Stock

export default function StockLayout() {
  const navigate = useNavigate()
  const { blocked, checking } = useModuleAvailability('stock')
  const [collapsed, setCollapsed] = useState(false)
  const [userInfo, setUserInfo] = useState({
    firstName: 'Gestionnaire', lastName: 'Stock', email: '', department: 'Stock', role: ''
  })

  useEffect(() => {
    let active = true
    userService.getProfile().then(res => {
      if (!active) return
      const p = res?.data || res
      setUserInfo({
        firstName:  p?.firstName  || 'Gestionnaire',
        lastName:   p?.lastName   || 'Stock',
        email:      p?.email      || getUserEmail() || '',
        department: p?.department || 'Stock',
        role:       p?.role       || getUserRole()  || 'admin_stock',
      })
    }).catch(() => {
      if (!active) return
      setUserInfo(u => ({ ...u, email: getUserEmail() || '', role: getUserRole() || '' }))
    })
    return () => { active = false }
  }, [])

  if (checking) return (
    <div className="page-loading">
      <div className="spinner spinner-lg" style={{ borderTopColor: ACCENT }} />
      <p className="text-sm">Chargement...</p>
    </div>
  )
  if (blocked) return <ModuleDisabledView accentColor={ACCENT} moduleLabel="Stock" />

  const isAdmin = userInfo.role === 'admin_principal'

  const navItems = [
    { to: '/stock/dashboard',  label: 'Dashboard',    Icon: BarChart3      },
    { to: '/stock/products',   label: 'Produits',     Icon: Package        },
    { to: '/stock/categories', label: 'Catégories',   Icon: Tags           },
    { to: '/stock/suppliers',  label: 'Fournisseurs', Icon: Truck          },
    { to: '/stock/movements',  label: 'Mouvements',   Icon: Repeat2        },
    { to: '/stock/alerts',     label: 'Alertes',      Icon: AlertTriangle  },
    { to: '/stock/settings',   label: 'Paramètres',   Icon: Settings       },
  ]

  const extraActions = isAdmin ? (
    <button
      onClick={() => navigate('/admin')}
      className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/6 transition-colors w-full"
    >
      <Crown size={13} />
      <span>Panneau Admin</span>
    </button>
  ) : null

  return (
    <div className="app-shell">
      <AppSidebar
        accentColor={ACCENT}
        title="Azer ERP"
        subtitle="Gestion Stock"
        navItems={navItems}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        userInfo={userInfo}
        onLogout={() => { clearAuth(); navigate('/login') }}
        extraActions={extraActions}
      />

      <main className={cn('main-content', collapsed && 'collapsed')}>
        <header className="page-header-bar">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[var(--fg)] truncate">Gestion des stocks</h1>
            <p className="text-xs text-[var(--fg-muted)] truncate hidden sm:block">
              Produits, catégories, fournisseurs et mouvements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <time
              dateTime={new Date().toISOString()}
              className="hidden sm:block text-xs text-[var(--fg-muted)] bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-medium"
            >
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </time>
            <ThemeToggle />
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
