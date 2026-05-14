import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, Search, Plus, Trash2, Calendar, Filter, ArrowDownRight, Download, SlidersHorizontal, X, Pencil, AlertTriangle, CheckCircle, Target } from 'lucide-react'
import { depensesService } from '../../../services/depensesService'
import { accountService } from '../../../services/accountService'
import { extractApiErrorMessage, mapAccountToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'
const today = new Date().toISOString().split('T')[0]

const EMPTY_DEPENSE = { description: '', amount: '', fournisseur: '', category: 'Achat', date: today, dateEcheance: '', status: 'en attente', notes: '', account: '' }
const DEPENSE_CATEGORIES = ['Achat', 'Loyer', 'Salaires', 'Charges sociales', 'Assurances', 'Fournitures', 'Transport', 'Marketing', 'Services extérieurs', 'Impôts', 'Autre']

export default function DepensesPage({ showNotif }) {
  const [depenses, setDepenses] = useState([])
  const [accounts, setAccounts] = useState([])
  const [limitSettings, setLimitSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  // UI States
  const [showFilters, setShowFilters] = useState(false)
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', item: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })

  const [filters, setFilters] = useState({ search: '', status: 'tous', category: 'tous', dateRange: { start: '', end: '' }, montantMin: '', montantMax: '' })
  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 })
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })
  const [formData, setFormData] = useState({ ...EMPTY_DEPENSE })
  const [formErrors, setFormErrors] = useState({})

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [depRes, accRes, limitRes] = await Promise.all([
        depensesService.getAll(),
        accountService.getAll({ limit: 200 }),
        depensesService.getSettings().catch(() => null)
      ])
      const formatted = (depRes.data || []).map(d => ({ ...d, id: d._id, amount: -Math.abs(d.amount) }))
      setDepenses(formatted)
      setAccounts(pickList(accRes, ['data']).map(mapAccountToUi))
      setLimitSettings(limitRes?.data || null)
    } catch (error) { notify('error', 'Impossible de charger les données') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const resetFilters = () => {
    setFilters({ search: '', status: 'tous', category: 'tous', dateRange: { start: '', end: '' }, montantMin: '', montantMax: '' })
    setPagination(p => ({ ...p, currentPage: 1 }))
  }

  const filteredData = useMemo(() => {
    return depenses.filter(item => {
      if (filters.search) {
        const s = filters.search.toLowerCase()
        if (![item.description, item.id, item.fournisseur, item.category].some(f => f?.toLowerCase().includes(s))) return false
      }
      if (filters.status !== 'tous' && item.status !== filters.status) return false
      if (filters.category !== 'tous' && item.category !== filters.category) return false
      if (filters.dateRange.start && item.date && item.date < filters.dateRange.start) return false
      if (filters.dateRange.end && item.date && item.date > filters.dateRange.end) return false
      if (filters.montantMin && Math.abs(item.amount || 0) < parseFloat(filters.montantMin)) return false
      if (filters.montantMax && Math.abs(item.amount || 0) > parseFloat(filters.montantMax)) return false
      return true
    })
  }, [depenses, filters])

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    let valA = a[sort.key], valB = b[sort.key]
    if (['date', 'dateEcheance', 'createdAt'].includes(sort.key)) { valA = new Date(valA || 0); valB = new Date(valB || 0) }
    if (['amount'].includes(sort.key)) { valA = Math.abs(Number(valA) || 0); valB = Math.abs(Number(valB) || 0) }
    return valA < valB ? (sort.direction === 'asc' ? -1 : 1) : valA > valB ? (sort.direction === 'asc' ? 1 : -1) : 0
  }), [filteredData, sort])

  const paginatedData = sortedData.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
  const totalPages = Math.ceil(sortedData.length / pagination.itemsPerPage)

  const stats = useMemo(() => {
    const paye = filteredData.filter(d => d.status === 'payé').length
    const attente = filteredData.filter(d => d.status === 'en attente').length
    const retard = filteredData.filter(d => d.status === 'en retard').length
    const montantTotal = filteredData.reduce((sum, d) => sum + Math.abs(d.amount || 0), 0)
    return { totalDepenses: montantTotal, totalPaye: paye, totalAttente: attente, totalRetard: retard }
  }, [filteredData])

  const depenseLimit = useMemo(() => {
    if (!limitSettings?.enabled || !Number(limitSettings.maxMonthlyAmount)) return null
    const max = Number(limitSettings.maxMonthlyAmount) || 0
    const used = Number(limitSettings.currentMonthTotal) || 0
    const percent = max > 0 ? Math.min(100, (used / max) * 100) : 0
    return { max, used, percent }
  }, [limitSettings])

  const openModal = (mode, item = null) => {
    if (item && mode === 'edit') setFormData({ ...item, amount: Math.abs(item.amount || 0).toString(), fournisseur: item.fournisseur || '', dateEcheance: item.dateEcheance ? item.dateEcheance.split('T')[0] : '', date: item.date ? item.date.split('T')[0] : '' })
    else setFormData({ ...EMPTY_DEPENSE })
    setModal({ isOpen: true, mode, item })
    setFormErrors({})
  }

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', item: null })
    setFormData({ ...EMPTY_DEPENSE })
    setFormErrors({})
  }

  const validate = () => {
    const e = {}
    if (!formData.description.trim()) e.description = 'Description requise'
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = 'Montant invalide (> 0)'
    if (!formData.account && modal.mode === 'add') e.account = 'Compte de paiement requis'
    if (!formData.date) e.date = 'Date requise'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const amount = Math.abs(parseFloat(formData.amount) || 0)
      if (limitSettings?.enabled && Number(limitSettings.maxMonthlyAmount)) {
        const previousAmount = modal.mode === 'edit' ? Math.abs(modal.item.amount || 0) : 0
        const projected = (Number(limitSettings.currentMonthTotal) || 0) - previousAmount + amount
        if (projected > Number(limitSettings.maxMonthlyAmount)) return notify('error', `Plafond dépassé (${projected.toFixed(2)} / ${limitSettings.maxMonthlyAmount} DT)`)
      }

      if (modal.mode === 'add') {
        const selectedAccount = accounts.find(a => String(a.id) === String(formData.account))
        if (!selectedAccount) return notify('error', 'Compte de paiement introuvable')
        if (Math.abs(selectedAccount.solde || 0) < amount) return notify('error', `Solde insuffisant (Restant: ${Math.abs(selectedAccount.solde).toFixed(2)} DT)`)
        await depensesService.create({ ...formData, amount })
        notify('success', 'Dépense enregistrée')
      } else {
        await depensesService.update(modal.item.id, { ...formData, amount })
        notify('success', 'Dépense modifiée')
      }
      await loadData()
      closeModal()
    } catch (err) { notify('error', extractApiErrorMessage(err, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await depensesService.delete(deleteTarget.id)
      await loadData()
      notify('success', 'Dépense supprimée')
      setDeleteTarget(null)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur de suppression')) }
  }

  const handleExport = async () => {
    try {
      await depensesService.exportToCSV()
      notify('success', 'Export CSV réussi')
    } catch (error) { notify('error', "Erreur lors de l'export") }
  }

  const setField = (k, v) => {
    setFormData(f => ({ ...f, [k]: v }))
    setFormErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const formatCurrency = (amount) => (amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }).replace('TND', 'DT')

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toastMsg.text && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[var(--shadow-lg)] text-sm font-semibold border ${toastMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'}`}>
            {toastMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/12 text-rose-500">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Dépenses & Charges</h1>
            <p className="text-xs text-[var(--fg-muted)]">Suivez et gérez vos décaissements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-all ${showFilters ? 'bg-rose-500/12 border-rose-500/25 text-rose-600 dark:text-rose-400' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'}`}>
            <SlidersHorizontal size={14} /> Filtres
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-all">
            <Download size={14} /> Exporter
          </button>
          <button onClick={() => openModal('add')} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/25 transition-all hover:-translate-y-px">
            <Plus size={16} /> Nouvelle dépense
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Dépenses', value: formatCurrency(stats.totalDepenses), color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
          { label: 'Payé', value: stats.totalPaye, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'En attente', value: stats.totalAttente, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'En retard', value: stats.totalRetard, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]">
            <span className="text-[11px] font-bold text-[var(--fg-subtle)] uppercase tracking-wider mb-1">{s.label}</span>
            <span className="text-xl font-bold text-[var(--fg)]">{s.value}</span>
            <div className="mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: s.color }} />
          </div>
        ))}
        {depenseLimit && (
          <div className="flex flex-col p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] relative overflow-hidden">
            <span className="text-[11px] font-bold text-[var(--fg-subtle)] uppercase tracking-wider mb-1">Plafond mensuel</span>
            <span className={`text-xl font-bold ${depenseLimit.percent >= 100 ? 'text-red-500' : depenseLimit.percent >= Number(limitSettings.warningThresholdPercent || 80) ? 'text-amber-500' : 'text-emerald-500'}`}>
              {depenseLimit.percent.toFixed(1)}%
            </span>
            <div className="mt-2 h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${depenseLimit.percent >= 100 ? 'bg-red-500' : depenseLimit.percent >= Number(limitSettings.warningThresholdPercent || 80) ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(depenseLimit.percent, 100)}%` }} />
            </div>
            <Target size={40} className="absolute -right-3 -bottom-3 text-[var(--border)] opacity-50" />
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-2">
              <div className="flex flex-col gap-1.5 xl:col-span-2">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Rechercher</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
                  <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="form-input pl-8 h-9" placeholder="Description, fournisseur..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Statut</label>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="tous">Tous statuts</option><option value="payé">Payé</option><option value="en attente">En attente</option><option value="en retard">En retard</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Catégorie</label>
                <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="tous">Toutes catégories</option>
                  {DEPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Du</label>
                <input type="date" value={filters.dateRange.start} onChange={e => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, start: e.target.value } }))} className="form-input h-9" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Au</label>
                <input type="date" value={filters.dateRange.end} onChange={e => setFilters(f => ({ ...f, dateRange: { ...f.dateRange, end: e.target.value } }))} className="form-input h-9" />
              </div>
              <div className="col-span-full pt-2 mt-2 border-t border-[var(--border)] flex items-center justify-end">
                <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                  <X size={12} /> Réinitialiser les filtres
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {[{l:'N°',k:'id'}, {l:'Date',k:'date'}, {l:'Échéance',k:'dateEcheance'}, {l:'Description',k:''}, {l:'Fournisseur',k:''}, {l:'Montant',k:'amount'}, {l:'Statut',k:''}, {l:'',k:''}].map(h => (
                  <th key={h.l} onClick={() => h.k && setSort({ key: h.k, direction: sort.key === h.k && sort.direction === 'desc' ? 'asc' : 'desc' })}
                      className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap ${h.k ? 'cursor-pointer hover:text-[var(--fg)]' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      {h.l} {h.k && sort.key === h.k && (sort.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" /></td>)}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map(d => (
                  <tr key={d.id} className={`hover:bg-[var(--bg-card-hover)] transition-colors group ${d.status === 'en retard' ? 'bg-red-500/5' : ''}`}>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-[11px] font-bold text-[var(--fg-subtle)]">{String(d.id).substring(0, 8)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]"><Calendar size={13} /> {new Date(d.date).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-[12px] font-semibold ${d.dateEcheance && new Date(d.dateEcheance) < new Date() && d.status !== 'payé' ? 'text-red-500' : 'text-[var(--fg-muted)]'}`}>
                        {d.dateEcheance ? new Date(d.dateEcheance).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--fg)] truncate max-w-[200px]" title={d.description}>{d.description}</span>
                        <span className="text-[11px] text-[var(--fg-subtle)] uppercase tracking-wider font-semibold">{d.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="text-[13px] text-[var(--fg-muted)]">{d.fournisseur || '—'}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-[14px] text-red-500">-{formatCurrency(Math.abs(d.amount))}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        d.status === 'payé' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        d.status === 'en attente' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => openModal('edit', d)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors" title="Modifier"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(d)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <Search size={28} className="text-[var(--border)] mb-2" />
                      <p className="font-medium text-[15px]">Aucune dépense trouvée</p>
                      <p className="text-xs">Modifiez vos filtres ou ajoutez une nouvelle dépense.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
            <span className="text-xs text-[var(--fg-muted)]">
              Affiche <span className="font-bold text-[var(--fg)]">{(pagination.currentPage - 1) * pagination.itemsPerPage + 1}</span> à <span className="font-bold text-[var(--fg)]">{Math.min(pagination.currentPage * pagination.itemsPerPage, sortedData.length)}</span> sur <span className="font-bold text-[var(--fg)]">{sortedData.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <select value={pagination.itemsPerPage} onChange={(e) => setPagination({ currentPage: 1, itemsPerPage: Number(e.target.value) })} className="h-8 px-2 text-xs rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)]">
                {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v} / page</option>)}
              </select>
              <div className="flex gap-1">
                <button disabled={pagination.currentPage === 1} onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))} className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">←</button>
                <span className="flex items-center justify-center px-3 text-xs font-semibold text-[var(--fg)]">{pagination.currentPage} / {totalPages}</span>
                <button disabled={pagination.currentPage === totalPages} onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))} className="flex items-center justify-center w-8 h-8 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">→</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.mode === 'add' ? 'Nouvelle dépense' : 'Modifier la dépense'} onConfirm={handleSave} confirmText={modal.mode === 'add' ? 'Ajouter' : 'Enregistrer'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Description" id="dep-desc" error={formErrors.description}><input type="text" value={formData.description} onChange={e => setField('description', e.target.value)} className={inputClass} placeholder="Achat fournitures de bureau..." autoFocus /></FormField>
          </div>
          
          <FormField label="Montant (DT)" id="dep-amount" error={formErrors.amount}>
            <input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setField('amount', e.target.value)} className={`${inputClass} font-mono`} placeholder="0.00" />
          </FormField>
          
          <FormField label="Fournisseur" id="dep-fournisseur">
            <input type="text" value={formData.fournisseur} onChange={e => setField('fournisseur', e.target.value)} className={inputClass} placeholder="Nom du fournisseur (Optionnel)" />
          </FormField>

          <FormField label="Catégorie" id="dep-cat">
            <select value={formData.category} onChange={e => setField('category', e.target.value)} className={selectClass}>
              {DEPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>

          {modal.mode === 'add' && (
            <FormField label="Compte de paiement" id="dep-acc" error={formErrors.account}>
              <select value={formData.account} onChange={e => setField('account', e.target.value)} className={selectClass}>
                <option value="" disabled>Sélectionner un compte...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </FormField>
          )}

          <FormField label="Date de la dépense" id="dep-date" error={formErrors.date}>
            <input type="date" value={formData.date} onChange={e => setField('date', e.target.value)} className={inputClass} />
          </FormField>
          
          <FormField label="Date d'échéance" id="dep-dateEch">
            <input type="date" value={formData.dateEcheance} onChange={e => setField('dateEcheance', e.target.value)} className={inputClass} />
          </FormField>

          <FormField label="Statut" id="dep-status">
            <select value={formData.status} onChange={e => setField('status', e.target.value)} className={selectClass}>
              <option value="payé">Payé</option>
              <option value="en attente">En attente</option>
              <option value="en retard">En retard</option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Notes / Référence" id="dep-notes">
              <textarea value={formData.notes} onChange={e => setField('notes', e.target.value)} className={inputClass} rows={2} placeholder="N° de facture, commentaires..." />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer la dépense" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette dépense sera supprimée et l'historique effacé.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
