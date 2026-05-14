/**
 * AppSidebar — Unified sidebar for all ERP modules
 * Props:
 *   accentColor  — hex color for active items & avatar (default: #6366f1)
 *   navItems     — [{ to, label, Icon }]
 *   title        — module title (e.g. "Gestion Stock")
 *   collapsed    — boolean
 *   onToggle     — () => void
 *   userInfo     — { firstName, lastName, email, department }
 *   onLogout     — () => void
 *   extraActions — optional JSX (e.g. "Retour Admin" button)
 */
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ThemeToggle'

export default function AppSidebar({
  accentColor = '#6366f1',
  navItems = [],
  title = 'ERP',
  subtitle = 'Module',
  collapsed = false,
  onToggle,
  userInfo = {},
  onLogout,
  extraActions,
}) {
  const initials = (userInfo.firstName?.charAt(0) || 'U').toUpperCase()
  const fullName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ') || 'Utilisateur'

  return (
    <aside
      className={cn(
        'sidebar',
        collapsed && 'collapsed'
      )}
    >
      {/* ── Header ── */}
      <div className="sidebar-header">
        <NavLink
          to="."
          className={cn(
            'flex items-center gap-3 min-w-0',
            collapsed ? 'justify-center w-full' : 'flex-1'
          )}
        >
          {/* Logo mark */}
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor}88)`,
              boxShadow: `0 4px 12px ${accentColor}40`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M10 20L18 28L30 12" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">{title}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest leading-tight truncate" style={{ color: accentColor === '#6366f1' ? '#a5b4fc' : `${accentColor}cc` }}>
                {subtitle}
              </p>
            </div>
          )}
        </NavLink>

        {/* Toggle */}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Réduire la sidebar"
            className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--fg-subtle)] hover:text-white hover:bg-white/8 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={15} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            aria-label="Agrandir la sidebar"
            className="absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] shadow-[var(--shadow-sm)] transition-colors z-10"
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* ── User Profile ── */}
      {!collapsed ? (
        <div className="sidebar-profile">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)` }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate">{fullName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userInfo.email}</p>
            {userInfo.department && (
              <span
                className="inline-block mt-1 px-2 py-px text-[9px] font-bold uppercase tracking-wider rounded-full"
                style={{ background: `${accentColor}22`, color: accentColor }}
              >
                {userInfo.department}
              </span>
            )}
          </div>
          <ThemeToggle className="flex-shrink-0 !bg-transparent !border-[var(--border-sidebar)] !text-slate-400 hover:!text-white hover:!bg-white/8" />
        </div>
      ) : (
        <div className="flex justify-center py-3 border-b border-[var(--border-sidebar)] flex-shrink-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)` }}
          >
            {initials}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {!collapsed && (
          <p className="sidebar-nav-label">Navigation</p>
        )}

        {navItems.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                collapsed && 'justify-center px-0 py-3',
                isActive && 'active'
              )
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className="flex-shrink-0"
                  style={isActive ? { color: accentColor } : {}}
                />
                {!collapsed && (
                  <span className="flex-1 truncate">{label}</span>
                )}
                {!collapsed && badge != null && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Extra module-specific actions */}
        {!collapsed && extraActions && (
          <div className="mt-4 pt-3 border-t border-[var(--border-sidebar)]">
            {extraActions}
          </div>
        )}
      </nav>

      {/* ── Footer / Logout ── */}
      <div className="sidebar-footer">
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-2.5 w-full rounded-lg transition-all duration-150',
            'text-slate-500 hover:text-red-400 hover:bg-red-500/8',
            collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 text-[13.5px] font-medium'
          )}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
