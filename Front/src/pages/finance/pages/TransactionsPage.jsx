import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, Search, Plus, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight, Download, SlidersHorizontal, X, Pencil, AlertTriangle, CheckCircle } from 'lucide-react'
import { transactionService } from '../../../services/transactionService'
import { accountService } from '../../../services/accountService'
import { extractApiErrorMessage, mapTransactionToUi, mapAccountToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'
const today = new Date().toISOString().split('T')[0]

const EMPTY_TRANSACTION = { description: '', amount: '', type: 'revenu', category: 'Vente', account: '', date: today, status: 'complété', notes: '' }

export default function TransactionsPage({ showNotif }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialAccount = searchParams.get('account') || 'tous'

  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI States
  const [showFilters, setShowFilters] = useState(false)
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', item: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })

  const [filters, setFilters] = useState({ search: '', type: 'tous', status: 'tous', category: 'tous', account: initialAccount, dateRange: { start: '', end: '' } })
  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 })
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })
  const [formData, setFormData] = useState({ ...EMPTY_TRANSACTION })
  const [formErrors, setFormErrors] = useState({})

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [txRes, accRes] = await Promise.all([
        transactionService.getAll({ limit: 500 }),
        accountService.getAll({ limit: 200 }),
      ])
      setTransactions(pickList(txRes, ['data']).map(mapTransactionToUi))
      setAccounts(pickList(accRes, ['data']).map(mapAccountToUi))
    } catch (error) { notify('error', extractApiErrorMessage(error, 'Impossible de charger les transactions')) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const resetFilters = () => {
    setFilters({ search: '', type: 'tous', status: 'tous', category: 'tous', account: 'tous', dateRange: { start: '', end: '' } })
    setPagination(p => ({ ...p, currentPage: 1 }))
  }

  const filteredData = useMemo(() => {
    return transactions.filter(item => {
      if (filters.search) {
        const s = filters.search.toLowerCase()
        if (![item.description, item.id].some(f => f?.toLowerCase().includes(s))) return false
      }
      if (filters.type !== 'tous' && item.type !== filters.type) return false
      if (filters.status !== 'tous' && item.status !== filters.status) return false
      if (filters.category !== 'tous' && item.category !== filters.category) return false
      if (filters.account !== 'tous' && item.account !== filters.account) return false
      if (filters.dateRange.start && item.date && item.date < filters.dateRange.start) return false
      if (filters.dateRange.end && item.date && item.date > filters.dateRange.end) return false
      return true
    })
  }, [transactions, filters])

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    let valA = a[sort.key], valB = b[sort.key]
    if (['date', 'createdAt'].includes(sort.key)) { valA = new Date(valA || 0); valB = new Date(valB || 0) }
    if (['amount'].includes(sort.key)) { valA = Number(valA) || 0; valB = Number(valB) || 0 }
    return valA < valB ? (sort.direction === 'asc' ? -1 : 1) : valA > valB ? (sort.direction === 'asc' ? 1 : -1) : 0
  }), [filteredData, sort])

  const paginatedData = sortedData.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
  const totalPages = Math.ceil(sortedData.length / pagination.itemsPerPage)

  const openModal = (mode, item = null) => {
    if (item && mode === 'edit') setFormData({ ...item, amount: Math.abs(item.amount || 0).toString() })
    else setFormData({ ...EMPTY_TRANSACTION })
    setModal({ isOpen: true, mode, item })
    setFormErrors({})
  }

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', item: null })
    setFormData({ ...EMPTY_TRANSACTION })
    setFormErrors({})
  }

  const validate = () => {
    const e = {}
    if (!formData.description.trim()) e.description = 'Description requise'
    if (!formData.amount || parseFloat(formData.amount) <= 0) e.amount = 'Montant invalide (> 0)'
    if (!formData.account) e.account = 'Compte requis'
    if (!formData.date) e.date = 'Date requise'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const amount = parseFloat(formData.amount) || 0
      const mainAcc = accounts.find(a => String(a.id) === String(formData.account) || a.name === formData.account)
      if (!mainAcc) return notify('error', 'Compte principal introuvable')
      const mainAccId = mainAcc.backendId || mainAcc.id

      let counterAcc = accounts.find(a => a.name.toLowerCase().includes(formData.type === 'revenu' ? 'client' : 'fournisseur'))
      if (!counterAcc) counterAcc = accounts.find(a => String(a.backendId || a.id) !== String(mainAccId))
      
      const counterAccId = counterAcc ? (counterAcc.backendId || counterAcc.id) : mainAccId
      
      const payload = { 
        date: formData.date, description: formData.description.trim(), reference: formData.notes, 
        entries: formData.type === 'revenu'
          ? [{ account: mainAccId, debit: amount, credit: 0, label: formData.category }, { account: counterAccId, debit: 0, credit: amount, label: formData.category }]
          : [{ account: counterAccId, debit: amount, credit: 0, label: formData.category }, { account: mainAccId, debit: 0, credit: amount, label: formData.category }]
      }

      if (modal.mode === 'edit') {
        const targetId = modal.item.backendId || modal.item.id
        await transactionService.update(targetId, payload)
        if (formData.status === 'complété') await transactionService.validate(targetId).catch(console.warn)
        notify('success', 'Transaction modifiée')
      } else {
        const res = await transactionService.create(payload)
        const newTxId = res?.data?.id || res?.data?._id
        if (formData.status === 'complété' && newTxId) await transactionService.validate(newTxId).catch(console.warn)
        notify('success', 'Transaction créée')
      }
      await loadData()
      closeModal()
    } catch (err) { notify('error', extractApiErrorMessage(err, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const targetId = deleteTarget.backendId || deleteTarget.id
      await transactionService.delete(targetId)
      await loadData()
      notify('success', 'Transaction supprimée')
      setDeleteTarget(null)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur de suppression')) }
  }

  const exportToCSV = () => {
    if (!filteredData.length) return notify('error', 'Aucune donnée à exporter')
    const csv = [Object.keys(filteredData[0]).join(','), ...filteredData.map(item => Object.values(item).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `transactions_${today}.csv` })
    a.click(); URL.revokeObjectURL(url)
    notify('success', 'Export CSV réussi')
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/12 text-blue-500">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Transactions</h1>
            <p className="text-xs text-[var(--fg-muted)]">Gérez vos revenus et dépenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-all ${showFilters ? 'bg-blue-500/12 border-blue-500/25 text-blue-600 dark:text-blue-400' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'}`}>
            <SlidersHorizontal size={14} /> Filtres
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-all">
            <Download size={14} /> Exporter
          </button>
          <button onClick={() => openModal('add')} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all hover:-translate-y-px">
            <Plus size={16} /> Nouvelle transaction
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Rechercher</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
                  <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="form-input pl-8 h-9" placeholder="Description ou ID..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Type</label>
                <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="tous">Tous types</option><option value="revenu">Revenus</option><option value="dépense">Dépenses</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Statut</label>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="tous">Tous statuts</option><option value="complété">Complété</option><option value="en attente">En attente</option><option value="en retard">En retard</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Compte</label>
                <select value={filters.account} onChange={e => setFilters(f => ({ ...f, account: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="tous">Tous les comptes</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
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
                {[{l:'N°',k:'id'}, {l:'Date',k:'date'}, {l:'Description',k:''}, {l:'Compte',k:''}, {l:'Montant',k:'amount'}, {l:'Statut',k:''}, {l:'',k:''}].map(h => (
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
                    {[...Array(7)].map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" /></td>)}
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map(t => (
                  <tr key={t.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-[11px] font-bold text-[var(--fg-subtle)]">{String(t.id).substring(0, 8)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]"><Calendar size={13} /> {new Date(t.date).toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--fg)] truncate max-w-[200px]" title={t.description}>{t.description}</span>
                        <span className="text-[11px] text-[var(--fg-subtle)] uppercase tracking-wider font-semibold">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="text-[13px] text-[var(--fg-muted)]">{t.account}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1 font-bold text-[14px] ${t.type === 'revenu' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {t.type === 'revenu' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        {t.type === 'revenu' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        t.status === 'complété' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        t.status === 'en attente' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                        'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => openModal('edit', t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors" title="Modifier"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <Search size={28} className="text-[var(--border)] mb-2" />
                      <p className="font-medium text-[15px]">Aucune transaction trouvée</p>
                      <p className="text-xs">Modifiez vos filtres ou ajoutez une nouvelle transaction.</p>
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
      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.mode === 'add' ? 'Nouvelle transaction' : 'Modifier la transaction'} onConfirm={handleSave} confirmText={modal.mode === 'add' ? 'Ajouter' : 'Enregistrer'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Description" id="tx-desc" error={formErrors.description}><input type="text" value={formData.description} onChange={e => setField('description', e.target.value)} className={inputClass} placeholder="Paiement facture N°..." autoFocus /></FormField>
          </div>
          
          <FormField label="Montant (DT)" id="tx-amount" error={formErrors.amount}>
            <input type="number" step="0.01" min="0" value={formData.amount} onChange={e => setField('amount', e.target.value)} className={`${inputClass} font-mono`} placeholder="0.00" />
          </FormField>
          
          <FormField label="Type" id="tx-type">
            <div className="flex bg-[var(--bg-subtle)] rounded-lg p-1 border border-[var(--border)]">
              {['revenu', 'dépense'].map(t => (
                <button key={t} type="button" onClick={() => setField('type', t)} className={`flex-1 h-8 text-xs font-semibold capitalize rounded-md transition-all ${formData.type === t ? 'bg-[var(--bg-card)] shadow text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                  {t}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Catégorie" id="tx-cat">
            <select value={formData.category} onChange={e => setField('category', e.target.value)} className={selectClass}>
              <option value="Vente">Vente produit</option>
              <option value="Loyer">Loyer</option>
              <option value="autre">Autre</option>
              <option value="vente_marchandise">Vente marchandise</option>
            </select>
          </FormField>

          <FormField label="Compte principal" id="tx-acc" error={formErrors.account}>
            <select value={formData.account} onChange={e => setField('account', e.target.value)} className={selectClass}>
              <option value="" disabled>Sélectionner un compte...</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </FormField>

          <FormField label="Date" id="tx-date" error={formErrors.date}>
            <input type="date" value={formData.date} onChange={e => setField('date', e.target.value)} className={inputClass} />
          </FormField>

          <FormField label="Statut" id="tx-status">
            <select value={formData.status} onChange={e => setField('status', e.target.value)} className={selectClass}>
              <option value="complété">Complété</option>
              <option value="en attente">En attente</option>
              <option value="en retard">En retard</option>
            </select>
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Notes / Référence" id="tx-notes">
              <textarea value={formData.notes} onChange={e => setField('notes', e.target.value)} className={inputClass} rows={2} placeholder="Détails supplémentaires..." />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer la transaction" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette transaction disparaîtra de vos relevés financiers et des soldes de compte.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
