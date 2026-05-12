import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import { clearAuth } from '@/utils/auth'
import { cn } from '@/lib/utils'

export default function Sidebar({ moduleName, moduleSubtitle, menuItems = [], accentColor = '#818cf8', basePath = '/', userInfo = {} }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-()">
        {!collapsed && (
          <NavLink to={basePath} className="flex items-center gap-3 flex-1 no-underline">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: accentColor }}>
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">ERP</h1>
              <p className="text-xs text-sidebar-foreground/60">{moduleSubtitle || moduleName}</p>
            </div>
          </NavLink>
        )}
        {collapsed && (
          <NavLink to={basePath} className="mx-auto">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accentColor }}>
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </NavLink>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-4 border-b border-()">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: accentColor }}>
              {userInfo.firstName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{userInfo.firstName} {userInfo.lastName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userInfo.email}</p>
              {userInfo.department && (
                <p className="text-xs text-sidebar-foreground/40 truncate">{userInfo.department}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">
            Menu {moduleName}
          </p>
        )}

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 no-underline',
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                isActive
                  ? 'text-white shadow-md'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white'
              )
            }
            style={({ isActive }) => isActive ? { background: accentColor } : {}}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon && <item.icon size={18} className="shrink-0" />}
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-()">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-danger/15 hover:text-danger transition-all duration-200 cursor-pointer',
            collapsed ? 'justify-center p-3' : 'px-3 py-2.5'
          )}
        >
          <LogOut size={18} />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-() border border-() shadow-lg cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 z-50 h-full w-[280px] bg-sidebar flex flex-col lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden lg:flex fixed top-0 left-0 h-full bg-sidebar flex-col z-30 border-r border-sidebar-border"
      >
        {sidebarContent}
      </motion.aside>

      {/* Spacer */}
      <motion.div
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden lg:block shrink-0"
      />
    </>
  )
}
