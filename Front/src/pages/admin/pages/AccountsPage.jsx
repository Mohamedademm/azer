// src/pages/admin/pages/AccountsPage.jsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Users, CheckCircle, XCircle, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import userService from '../../../services/userService'
import { extractApiErrorMessage, mapUserToAdminAccount, pickList } from '../../../utils/frontendApiAdapters'

const ROLE_CONFIG = {
  admin_principal: { label: 'Admin Principal', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)' },
  admin_stock:     { label: 'Gestionnaire Stock',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
  admin_finance:   { label: 'Gestionnaire Finance',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  admin_facture:   { label: 'Gestionnaire Facture',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)'  },
}

const getRoleCfg = (role) => ROLE_CONFIG[role] || { label: role || 'Utilisateur', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' }

const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'

export default function AccountsPage() {
  const [accounts, setAccounts]     = useState([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [toastMsg, setToastMsg]     = useState({ type: '', text: '' })

  const filtered = accounts.filter(a =>
    `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:    accounts.length,
    actifs:   accounts.filter(a => a.active).length,
    inactifs: accounts.filter(a => !a.active).length,
  }

  const showToast = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
  }

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await userService.getUsers({ limit: 200 })
      setAccounts(pickList(res, ['data']).map(mapUserToAdminAccount))
    } catch (e) {
      showToast('error', extractApiErrorMessage(e, 'Impossible de charger les comptes'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAccounts() }, [])

  const toggleStatus = async (accountId) => {
    try {
      const res = await userService.toggleUserStatus(accountId)
      await loadAccounts()
      showToast('success', res.data.isActive ? 'Compte activé avec succès' : 'Compte désactivé avec succès')
    } catch (e) {
      showToast('error', extractApiErrorMessage(e, 'Impossible de modifier le statut'))
    }
  }

  const toggleAll = async (activate) => {
    const toUpdate = accounts.filter(a => a.active !== activate)
    if (!toUpdate.length) return
    try {
      await Promise.all(toUpdate.map(a => userService.toggleUserStatus(a.id)))
      await loadAccounts()
      showToast('success', activate ? 'Tous les comptes activés' : 'Tous les comptes désactivés')
    } catch (e) {
      showToast('error', extractApiErrorMessage(e, 'Impossible de mettre à jour'))
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toastMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[var(--shadow-lg)] text-sm font-semibold border ${
              toastMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
            }`}
          >
            {toastMsg.type === 'success'
              ? <CheckCircle size={16} />
              : <XCircle size={16} />
            }
            {toastMsg.text}
            <button onClick={() => setToastMsg({ type: '', text: '' })} className="ml-1 opacity-60 hover:opacity-100">
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Title ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Comptes utilisateurs</h1>
          <p className="text-xs text-[var(--fg-muted)]">Gérez les accès et statuts de tous les comptes</p>
        </div>
        <button
          onClick={loadAccounts}
          className="ml-auto flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-all"
          title="Actualiser"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total comptes', value: stats.total,    color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
          { label: 'Actifs',        value: stats.actifs,   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
          { label: 'Inactifs',      value: stats.inactifs, color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
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
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-9 rounded-lg text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => toggleAll(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold border border-emerald-500/25 bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/14 transition-colors dark:text-emerald-400"
          >
            <ToggleRight size={14} /> Tout activer
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold border border-red-500/25 bg-red-500/8 text-red-600 hover:bg-red-500/14 transition-colors dark:text-red-400"
          >
            <ToggleLeft size={14} /> Tout désactiver
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {['État', 'Utilisateur', 'Email', 'Rôle', 'Département', 'Créé le', 'Dernière connexion', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[var(--bg-subtle)] rounded-full w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(account => {
                  const roleCfg = getRoleCfg(account.role)
                  return (
                    <motion.tr
                      key={account.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: account.active ? 1 : 0.55 }}
                      className="hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          account.active
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-[var(--bg-subtle)] text-[var(--fg-subtle)] border-[var(--border)]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${account.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {account.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>

                      {/* User Avatar + Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-full text-white text-[12px] font-bold flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${roleCfg.color}cc, ${roleCfg.color}66)` }}
                          >
                            {getInitials(account.firstName, account.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--fg)] truncate max-w-[140px]">
                              {account.firstName} {account.lastName}
                            </p>
                            <p className="text-[11px] text-[var(--fg-subtle)] font-mono truncate max-w-[140px]">
                              #{String(account.id).substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-[var(--fg-muted)]">{account.email}</span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border"
                          style={{ background: roleCfg.bg, color: roleCfg.color, borderColor: roleCfg.border }}
                        >
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[13px] text-[var(--fg-muted)]">{account.department || '—'}</span>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[12.5px] text-[var(--fg-subtle)]">{account.createdAt || '—'}</span>
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-[12.5px] text-[var(--fg-subtle)]">{account.lastLogin || 'Jamais'}</span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => toggleStatus(account.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 border ${
                            account.active
                              ? 'bg-red-500/8 text-red-600 border-red-500/20 hover:bg-red-500/15 dark:text-red-400'
                              : 'bg-emerald-500/8 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:text-emerald-400'
                          }`}
                        >
                          {account.active
                            ? <><ToggleLeft size={13} /> Désactiver</>
                            : <><ToggleRight size={13} /> Activer</>
                          }
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <Users size={28} className="text-[var(--fg-subtle)]" />
                      <p className="font-medium">Aucun compte trouvé</p>
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
            <span className="font-semibold text-[var(--fg)]">{filtered.length}</span> compte{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
            {accounts.length !== filtered.length && ` sur ${accounts.length}`}
          </span>
          <span className="text-xs text-[var(--fg-subtle)]">
            {stats.actifs} actif{stats.actifs !== 1 ? 's' : ''} · {stats.inactifs} inactif{stats.inactifs !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}