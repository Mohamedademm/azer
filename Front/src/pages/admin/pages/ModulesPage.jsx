// src/pages/admin/pages/ModulesPage.jsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, ToggleLeft, ToggleRight, Layers } from 'lucide-react'
import userService from '../../../services/userService'
import { extractApiErrorMessage } from '../../../utils/frontendApiAdapters'

const INITIAL_MODULES = [
  { id: 'facturation', name: 'Facturation', icon: '💰', color: '#f59e0b', count: 12, active: true, type: 'base', category: 'Comptabilité', createdAt: '2024-01-15' },
  { id: 'stock',       name: 'Stock',       icon: '📦', color: '#6366f1', count: 8,  active: true, type: 'base', category: 'Inventaire',   createdAt: '2024-01-15' },
  { id: 'finance',     name: 'Finance',     icon: '💵', color: '#10b981', count: 5,  active: true, type: 'base', category: 'Finance',      createdAt: '2024-01-15' },
]

export default function ModulesPage() {
  const [baseModules, setBaseModules]       = useState(INITIAL_MODULES)
  const [customModules, setCustomModules]   = useState([])
  const [search, setSearch]                 = useState('')
  const [errorMessage, setErrorMessage]     = useState('')

  const allModules     = [...baseModules, ...customModules]
  const activeCount    = allModules.filter(m => m.active).length
  const inactiveCount  = allModules.length - activeCount

  const filtered = allModules.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase()) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  )

  /* ── Persistence ── */
  const save = async (nextBase, nextCustom) => {
    await userService.updatePreferences('admin', {
      modules: [...nextBase, ...nextCustom].map(m => ({ id: m.id, active: m.active }))
    })
  }

  useEffect(() => {
    userService.getPreferences('admin').catch(() => ({ data: {} })).then(res => {
      const prefs = res?.data || res
      const entries = Array.isArray(prefs?.modules)
        ? prefs.modules
        : Object.entries(prefs?.moduleStates || {}).map(([id, active]) => ({ id, active }))
      if (!entries.length) return
      const map = new Map(entries.map(e => [e.id, e.active !== false]))
      setBaseModules(prev => prev.map(m => map.has(m.id) ? { ...m, active: map.get(m.id) } : m))
      setCustomModules(prev => prev.map(m => map.has(m.id) ? { ...m, active: map.get(m.id) } : m))
    }).catch(() => {})
  }, [])

  const toggle = async (id) => {
    const nextBase   = baseModules.map(m   => m.id === id ? { ...m, active: !m.active } : m)
    const nextCustom = customModules.map(m => m.id === id ? { ...m, active: !m.active } : m)
    setBaseModules(nextBase)
    setCustomModules(nextCustom)
    try { await save(nextBase, nextCustom) }
    catch (e) {
      setErrorMessage(extractApiErrorMessage(e, "Impossible d'enregistrer"))
      userService.getPreferences('admin').catch(() => ({})).then(res => {
        const prefs = res?.data || res
        const entries = Array.isArray(prefs?.modules) ? prefs.modules : []
        const map = new Map(entries.map(e => [e.id, e.active !== false]))
        if (map.size) {
          setBaseModules(prev   => prev.map(m => map.has(m.id) ? { ...m, active: map.get(m.id) } : m))
          setCustomModules(prev => prev.map(m => map.has(m.id) ? { ...m, active: map.get(m.id) } : m))
        }
      }).catch(() => {})
    }
  }

  const toggleAll = async (activate) => {
    const nextBase   = baseModules.map(m   => ({ ...m, active: activate }))
    const nextCustom = customModules.map(m => ({ ...m, active: activate }))
    setBaseModules(nextBase)
    setCustomModules(nextCustom)
    try { await save(nextBase, nextCustom) }
    catch (e) { setErrorMessage(extractApiErrorMessage(e, "Impossible d'enregistrer")) }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
          <Layers size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Gestion des modules</h1>
          <p className="text-xs text-[var(--fg-muted)]">Activez ou désactivez les modules disponibles</p>
        </div>
      </div>

      {/* ── Error ── */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-500 text-sm">
          <X size={15} className="flex-shrink-0" />
          {errorMessage}
          <button onClick={() => setErrorMessage('')} className="ml-auto text-red-400 hover:text-red-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: allModules.length, color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
          { label: 'Actifs',   value: activeCount,       color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
          { label: 'Inactifs', value: inactiveCount,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
        ].map(s => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]"
          >
            <div>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mt-1">{s.label}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <div className="w-4 h-4 rounded-full" style={{ background: s.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={[
              'w-full h-9 pl-9 pr-9 rounded-lg text-sm',
              'bg-[var(--bg-card)] border border-[var(--border)]',
              'text-[var(--fg)] placeholder:text-[var(--fg-subtle)]',
              'outline-none transition-all duration-150',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15',
            ].join(' ')}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Bulk actions */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold border border-emerald-500/25 bg-emerald-500/8 text-emerald-500 hover:bg-emerald-500/14 transition-colors"
          >
            <ToggleRight size={14} />
            Tout activer
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold border border-red-500/25 bg-red-500/8 text-red-500 hover:bg-red-500/14 transition-colors"
          >
            <ToggleLeft size={14} />
            Tout désactiver
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {['État', 'Icône', 'Nom', 'Catégorie', 'Type', 'Créé le', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length > 0 ? filtered.map(mod => (
                <motion.tr
                  key={mod.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${mod.active
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                      : 'bg-[var(--bg-subtle)] text-[var(--fg-subtle)] border-[var(--border)]'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${mod.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {mod.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>

                  {/* Icon */}
                  <td className="px-5 py-3.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${mod.color}15` }}
                    >
                      {mod.icon}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--fg)]">{mod.name}</span>
                      {mod.count > 0 && (
                        <span
                          className="flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1 text-white"
                          style={{ background: mod.color }}
                        >
                          {mod.count}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-[var(--fg-muted)] text-[13px]">{mod.category || 'Général'}</span>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      mod.type === 'base'
                        ? 'bg-indigo-500/8 text-indigo-600 border-indigo-500/20 dark:text-indigo-400'
                        : 'bg-amber-500/8 text-amber-600 border-amber-500/20 dark:text-amber-400'
                    }`}>
                      {mod.type === 'base' ? 'Base' : 'Custom'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-[var(--fg-subtle)] text-[12.5px]">{mod.createdAt || '—'}</span>
                  </td>

                  {/* Toggle Action */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <button
                      onClick={() => toggle(mod.id)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                        mod.active
                          ? 'bg-red-500/8 text-red-500 border border-red-500/20 hover:bg-red-500/15'
                          : 'bg-emerald-500/8 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/15'
                      }`}
                    >
                      {mod.active ? <><ToggleLeft size={13} /> Désactiver</> : <><ToggleRight size={13} /> Activer</>}
                    </button>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-[var(--fg-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="text-[var(--fg-subtle)]" />
                      <p className="font-medium">Aucun module trouvé</p>
                      {search && <p className="text-xs">pour "{search}"</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <span className="text-xs text-[var(--fg-muted)]">
            <span className="font-semibold text-[var(--fg)]">{filtered.length}</span> module{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
            {allModules.length !== filtered.length && ` sur ${allModules.length}`}
          </span>
          <span className="text-xs text-[var(--fg-subtle)]">
            {activeCount} actif{activeCount !== 1 ? 's' : ''} · {inactiveCount} inactif{inactiveCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}