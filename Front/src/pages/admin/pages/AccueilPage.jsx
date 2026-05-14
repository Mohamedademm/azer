// src/pages/admin/pages/AccueilPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Package, DollarSign, FileText, Layers, Search, X,
  TrendingUp, ArrowRight
} from 'lucide-react'
import userService from '../../../services/userService'

const BASE_MODULES = [
  {
    id: 'facturation', name: 'Facturation', icon: FileText,
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)',
    count: 12, category: 'Comptabilité',
    description: 'Gérez vos commandes, clients, factures et archives',
    stats: ['12 commandes', '8 clients', '5 factures'],
  },
  {
    id: 'stock', name: 'Stock', icon: Package,
    color: '#6366f1', bgColor: 'rgba(99,102,241,0.1)',
    count: 8, category: 'Inventaire',
    description: 'Gérez vos produits, catégories, fournisseurs et mouvements',
    stats: ['150 produits', '12 catégories', '3 alertes'],
  },
  {
    id: 'finance', name: 'Finance', icon: DollarSign,
    color: '#10b981', bgColor: 'rgba(16,185,129,0.1)',
    count: 5, category: 'Finance',
    description: 'Suivez vos comptes, transactions, dépenses et rapports',
    stats: ['24 transactions', '3 comptes', '8 rapports'],
  },
]

const ALL_PAGES = [
  { id: 1, name: 'Dashboard Facturation',  path: '/facturation/dashboard', icon: BarChart3,   color: '#f59e0b', module: 'facturation' },
  { id: 2, name: 'Dashboard Stock',        path: '/stock/dashboard',       icon: BarChart3,   color: '#6366f1', module: 'stock' },
  { id: 3, name: 'Dashboard Finance',      path: '/finance/dashboard',     icon: BarChart3,   color: '#10b981', module: 'finance' },
  { id: 4, name: 'Gestion Stock',          path: '/stock/products',        icon: Package,     color: '#6366f1', module: 'stock' },
  { id: 5, name: 'Commandes',             path: '/facturation/orders',    icon: FileText,    color: '#f59e0b', module: 'facturation' },
  { id: 6, name: 'Transactions Finance',   path: '/finance/transactions',  icon: DollarSign,  color: '#10b981', module: 'finance' },
]

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export default function AccueilPage() {
  const navigate = useNavigate()
  const [userName, setUserName]       = useState('Admin')
  const [searchTerm, setSearchTerm]   = useState('')
  const [activeModules]               = useState(BASE_MODULES)

  useEffect(() => {
    let active = true
    userService.getProfile().then(res => {
      if (!active) return
      const p = res?.data || res
      setUserName(p?.firstName || 'Admin')
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const filteredPages = searchTerm
    ? ALL_PAGES.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">En ligne</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--fg)] leading-tight">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une page..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={[
              'w-full h-10 pl-9 pr-9 rounded-xl text-sm',
              'bg-[var(--bg-subtle)] border border-[var(--border)]',
              'text-[var(--fg)] placeholder:text-[var(--fg-subtle)]',
              'outline-none transition-all duration-150',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15',
            ].join(' ')}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Search Results ── */}
      {searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
            {filteredPages.length} résultat{filteredPages.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPages.map(page => {
              const Icon = page.icon
              return (
                <button
                  key={page.id}
                  onClick={() => navigate(page.path)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 text-left"
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                    style={{ background: `${page.color}18`, color: page.color }}
                  >
                    <Icon size={17} />
                  </div>
                  <span className="text-sm font-medium text-[var(--fg)]">{page.name}</span>
                  <ArrowRight size={14} className="ml-auto text-[var(--fg-subtle)]" />
                </button>
              )
            })}
            {filteredPages.length === 0 && (
              <p className="col-span-3 py-8 text-center text-sm text-[var(--fg-muted)]">
                Aucun résultat pour "{searchTerm}"
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Quick Stats ── */}
      {!searchTerm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {[
            { label: 'Modules actifs',    value: activeModules.length, icon: Layers,     color: '#6366f1' },
            { label: 'Actions récentes',  value: 25,                   icon: TrendingUp,  color: '#10b981' },
            { label: 'Pages disponibles', value: ALL_PAGES.length,     icon: BarChart3,   color: '#f59e0b' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]"
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--fg)] leading-none">{stat.value}</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-1">{stat.label}</p>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* ── Module Cards ── */}
      {!searchTerm && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--fg)]">Modules actifs</h2>
            <span className="text-xs text-[var(--fg-muted)] font-medium">{activeModules.length} modules</span>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {activeModules.map(mod => {
              const Icon = mod.icon
              return (
                <motion.div
                  key={mod.id}
                  variants={item}
                  className="group flex flex-col bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  {/* Card top */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl"
                      style={{ background: mod.bgColor, color: mod.color }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border text-[var(--fg-muted)] border-[var(--border)] bg-[var(--bg-subtle)]">
                      {mod.category}
                    </span>
                  </div>

                  {/* Title & description */}
                  <h3 className="text-lg font-bold text-[var(--fg)] mb-1 group-hover:text-indigo-500 transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed mb-5 flex-1">
                    {mod.description}
                  </p>

                  {/* Stats pills */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {mod.stats.map(s => (
                      <span
                        key={s}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: mod.bgColor, color: mod.color }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-2.5 mt-auto">
                    <button
                      onClick={() => navigate(`/${mod.id}/dashboard`)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
                      style={{
                        background: `linear-gradient(135deg, ${mod.color}dd, ${mod.color}99)`,
                        boxShadow: `0 2px 8px ${mod.color}40`,
                      }}
                    >
                      <BarChart3 size={14} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate(`/${mod.id}`)}
                      className="flex-1 h-9 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] transition-all duration-150"
                    >
                      Gestion
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </>
      )}
    </div>
  )
}