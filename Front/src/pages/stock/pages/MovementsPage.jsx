import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftRight, Search, Plus, Trash2, Calendar, Filter, ArrowUpRight, ArrowDownRight, PackageOpen, AlertTriangle } from 'lucide-react'
import stockMovementService from '../../../services/stockMovementService'
import productService from '../../../services/productService'
import { extractApiErrorMessage, mapMovementToUi, mapProductToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const MV = { IN: 'entrée', OUT: 'sortie' }
const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'

export default function MovementsPage() {
  const [movements, setMovements] = useState([])
  const [products, setProducts]   = useState([])
  const [stats, setStats]         = useState({ global: { totalEntries: 0, totalExits: 0, totalMovements: 0, uniqueProducts: 0 } })
  const [loading, setLoading]     = useState(true)
  
  // UI States
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  
  // Forms & Filters
  const [filters, setFilters] = useState({ movement: 'all', searchProduct: '', startDate: '', endDate: '' })
  const [formData, setFormData] = useState({ productId: '', product: '', type: MV.IN, quantity: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [formErrors, setFormErrors] = useState({})
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })

  const showToast = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [movRes, prodRes, statsRes] = await Promise.all([
        stockMovementService.getAll({ limit: 200 }),
        productService.getAll({ limit: 200 }),
        stockMovementService.getStats(),
      ])
      setMovements(pickList(movRes, ['movements', 'data']).map(mapMovementToUi))
      setProducts(pickList(prodRes, ['products', 'data']).map(mapProductToUi))
      if (statsRes) setStats({ global: statsRes.global, topProducts: statsRes.topProducts })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => movements.filter(m =>
    (filters.movement === 'all' || m.type === filters.movement) &&
    (!filters.startDate || m.date >= filters.startDate) &&
    (!filters.endDate || m.date <= filters.endDate) &&
    (!filters.searchProduct || m.product.toLowerCase().includes(filters.searchProduct.toLowerCase()))
  ), [movements, filters])

  const resetForm = () => {
    setFormData({ productId: '', product: '', type: MV.IN, quantity: '', date: new Date().toISOString().split('T')[0], note: '' })
    setFormErrors({})
  }

  const handleProductChange = (e) => {
    const id = e.target.value
    const p = products.find(prod => String(prod.id) === String(id))
    if (p) {
      setFormData(prev => ({ ...prev, productId: id, product: p.name }))
      setFormErrors(prev => { const n = { ...prev }; delete n.productId; return n })
    }
  }

  const validate = () => {
    const e = {}
    if (!formData.productId) e.productId = 'Produit requis'
    if (!formData.quantity || parseInt(formData.quantity) <= 0) e.quantity = 'Quantité invalide (> 0)'
    if (formData.type === MV.OUT && formData.productId) {
      const p = products.find(prod => String(prod.id) === String(formData.productId))
      if (p && parseInt(formData.quantity) > p.stock) e.quantity = `Stock insuffisant (${p.stock} restants)`
    }
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const payload = { productId: formData.productId, quantity: formData.quantity, note: formData.note }
      if (formData.type === MV.IN) await stockMovementService.addEntry(payload)
      else await stockMovementService.addExit(payload)
      
      await loadData()
      showToast('success', 'Mouvement enregistré')
      setModalOpen(false)
      resetForm()
    } catch (err) { showToast('error', extractApiErrorMessage(err, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await stockMovementService.delete(deleteTarget.id)
      await loadData()
      showToast('success', 'Mouvement supprimé')
      setDeleteTarget(null)
    } catch (err) { showToast('error', extractApiErrorMessage(err, 'Erreur de suppression')) }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toastMsg.text && (
          <motion.div initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[var(--shadow-lg)] text-sm font-semibold border ${toastMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'}`}>
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Mouvements de stock</h1>
            <p className="text-xs text-[var(--fg-muted)]">Historique des entrées et sorties</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-all ${showFilters ? 'bg-indigo-500/12 border-indigo-500/25 text-indigo-600 dark:text-indigo-400' : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'}`}>
            <Filter size={14} /> Filtres
          </button>
          <button onClick={() => { resetForm(); setModalOpen(true) }} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px">
            <Plus size={16} /> Nouveau mouvement
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Mouvements', value: stats.global.totalMovements, color: '#6366f1', bg: 'rgba(99,102,241,0.1)',   icon: <ArrowLeftRight size={18} /> },
          { label: 'Entrées (Qté)',    value: stats.global.totalEntries,   color: '#10b981', bg: 'rgba(16,185,129,0.1)',   icon: <ArrowDownRight size={18} /> },
          { label: 'Sorties (Qté)',    value: stats.global.totalExits,     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: <ArrowUpRight size={18} /> },
          { label: 'Produits impactés',value: stats.global.uniqueProducts, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', icon: <PackageOpen size={18} /> },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-[var(--fg)] leading-none truncate">{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Rechercher un produit</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
                  <input type="text" value={filters.searchProduct} onChange={e => setFilters(f => ({ ...f, searchProduct: e.target.value }))} className="form-input pl-8 h-9" placeholder="Nom du produit..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Date de début</label>
                <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} className="form-input h-9" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Date de fin</label>
                <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} className="form-input h-9" />
              </div>
              
              <div className="col-span-full pt-2 mt-2 border-t border-[var(--border)] flex items-center justify-between">
                <div className="flex gap-2 bg-[var(--bg-subtle)] p-1 rounded-lg">
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: MV.IN, label: 'Entrées' },
                    { value: MV.OUT, label: 'Sorties' }
                  ].map(tab => (
                    <button key={tab.value} onClick={() => setFilters(f => ({ ...f, movement: tab.value }))}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${filters.movement === tab.value ? 'bg-[var(--bg-card)] shadow text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                {(filters.searchProduct || filters.startDate || filters.endDate || filters.movement !== 'all') && (
                  <button onClick={() => setFilters({ movement: 'all', searchProduct: '', startDate: '', endDate: '' })} className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                    <X size={12} /> Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {['ID', 'Date', 'Type', 'Produit', 'Quantité', 'Note', 'Utilisateur', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" /></td>)}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(m => (
                  <tr key={m.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-[var(--fg-subtle)]">{String(m.id).substring(0, 8)}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]">
                        <Calendar size={13} /> {new Date(m.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        m.type === MV.IN ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
                      }`}>
                        {m.type === MV.IN ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {m.type === MV.IN ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-medium text-[var(--fg)]">{m.product}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`font-bold text-[14px] ${m.type === MV.IN ? 'text-emerald-500' : 'text-red-500'}`}>
                        {m.type === MV.IN ? '+' : '-'}{m.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap max-w-[200px] truncate">
                      <span className="text-[13px] text-[var(--fg-subtle)]">{m.note || '—'}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-[12px] font-semibold text-[var(--fg-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">{m.user || 'Système'}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button onClick={() => setDeleteTarget(m)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <ArrowLeftRight size={28} className="text-[var(--border)] mb-2" />
                      <p className="font-medium text-[15px]">Aucun mouvement trouvé</p>
                      <p className="text-xs">Modifiez vos filtres ou ajoutez un nouveau mouvement.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <span className="text-xs text-[var(--fg-muted)]">
            <span className="font-semibold text-[var(--fg)]">{filtered.length}</span> mouvement{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== movements.length && ` affiché(s) sur ${movements.length}`}
          </span>
        </div>
      </div>

      {/* ── Add Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title="Nouveau mouvement de stock" onConfirm={handleSave} confirmText="Enregistrer" size="md">
        <div className="flex flex-col gap-4">
          <FormField label="Produit" id="mvmt-prod" error={formErrors.productId}>
            <select value={formData.productId} onChange={handleProductChange} className={`${selectClass} ${formErrors.productId ? 'border-red-500' : ''}`}>
              <option value="">Sélectionner un produit...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </FormField>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type de mouvement" id="mvmt-type">
              <select value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value }))} className={selectClass}>
                <option value={MV.IN}>Entrée (Ajout)</option>
                <option value={MV.OUT}>Sortie (Retrait)</option>
              </select>
            </FormField>
            <FormField label="Quantité" id="mvmt-qty" error={formErrors.quantity}>
              <input type="number" min="1" value={formData.quantity} onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))} className={`${inputClass} ${formErrors.quantity ? 'border-red-500 focus:border-red-500' : ''}`} placeholder="ex: 50" />
            </FormField>
          </div>

          <FormField label="Date" id="mvmt-date">
            <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className={inputClass} />
          </FormField>

          <FormField label="Note / Motif" id="mvmt-note">
            <textarea value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} className={inputClass} rows={2} placeholder="Justification du mouvement..." />
          </FormField>
          
          {formData.productId && formData.type === MV.OUT && (
            <div className="p-3 mt-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle size={14} /> Attention, le stock actuel est de {products.find(p => String(p.id) === String(formData.productId))?.stock}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le mouvement" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette action annulera l'effet de ce mouvement sur le stock du produit.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}