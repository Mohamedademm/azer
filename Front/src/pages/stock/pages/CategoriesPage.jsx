import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderTree, Plus, Pencil, Trash2, Search, X, Package, AlertTriangle } from 'lucide-react'
import categoryService from '../../../services/categoryService'
import productService from '../../../services/productService'
import { extractApiErrorMessage, mapCategoryToUi, mapProductToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import StatusBadge from '../../../components/common/StatusBadge'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'

export default function CategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [products, setProducts]     = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [modalOpen, setModalOpen]   = useState(false)
  const [editCat, setEditCat]       = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [productsModal, setProductsModal] = useState(null)

  // Form state
  const [formData, setFormData]     = useState({ name: '', code: '', description: '' })
  const [formErrors, setFormErrors] = useState({})
  const [toastMsg, setToastMsg]     = useState({ type: '', text: '' })

  const showToast = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, prodRes, statsRes] = await Promise.all([
        categoryService.getAll({ limit: 200 }),
        productService.getAll({ limit: 200 }),
        categoryService.getStats(),
      ])
      setCategories(pickList(catRes, ['categories', 'data']).map(mapCategoryToUi))
      setProducts(pickList(prodRes, ['products', 'data']).map(mapProductToUi))
      setStats(statsRes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => categories.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [categories, searchQuery])

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' })
    setEditCat(null)
    setFormErrors({})
  }

  const openAdd = () => { resetForm(); setModalOpen(true) }
  const openEdit = (c) => {
    setEditCat(c)
    setFormData({ name: c.name, code: c.code, description: c.description || '' })
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Nom requis'
    else if (formData.name.length > 50) e.name = 'Maximum 50 caractères'
    if (!formData.code.trim()) e.code = 'Code unique requis (ex: CA-145)'
    if (formData.description.length > 200) e.description = 'Maximum 200 caractères'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const payload = { name: formData.name.trim(), code: formData.code.trim(), description: formData.description.trim() }
      if (editCat) {
        await categoryService.update(editCat.id, payload)
        showToast('success', 'Catégorie modifiée')
      } else {
        await categoryService.create(payload)
        showToast('success', 'Catégorie créée')
      }
      await loadData()
      setModalOpen(false)
    } catch (e) { showToast('error', extractApiErrorMessage(e, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await categoryService.delete(deleteTarget.id)
      await loadData()
      showToast('success', 'Catégorie supprimée')
      setDeleteTarget(null)
    } catch (e) { showToast('error', extractApiErrorMessage(e, 'Erreur de suppression')) }
  }

  const setField = (k, v) => {
    setFormData(f => ({ ...f, [k]: v }))
    setFormErrors(e => { const n = { ...e }; delete n[k]; return n })
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
              toastMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
            }`}
          >
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/12 text-blue-500">
            <FolderTree size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Catégories</h1>
            <p className="text-xs text-[var(--fg-muted)]">Organisez vos produits efficacement</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all hover:-translate-y-px"
        >
          <Plus size={16} /> Nouvelle catégorie
        </button>
      </div>

      {/* ── Stats ── */}
      {stats?.global && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Catégories', value: stats.global.totalCategories, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            { label: 'Total Produits',   value: stats.global.totalProducts,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Catégories Vides', value: stats.global.emptyCategories, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: s.bg, color: s.color }}>
                <FolderTree size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--fg)] leading-none">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)] mt-1.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher une catégorie..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-xl text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="group relative flex flex-col p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500">
                    <FolderTree size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--fg)]">{c.name}</h3>
                    {c.code && <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-subtle)] text-[var(--fg-muted)] font-mono">{c.code}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded text-[var(--fg-muted)] hover:bg-blue-500/10 hover:text-blue-500 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(c)} className="w-7 h-7 flex items-center justify-center rounded text-[var(--fg-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="text-sm text-[var(--fg-subtle)] flex-1 mb-4 line-clamp-2">{c.description || 'Aucune description.'}</p>
              <div className="pt-4 border-t border-[var(--border)]">
                <button
                  onClick={() => setProductsModal(c)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-[var(--fg-muted)] hover:text-blue-500 transition-colors"
                >
                  <span className="flex items-center gap-2"><Package size={16} /> {c.productCount || 0} produits</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--fg-muted)]">
          <FolderTree size={40} className="text-[var(--border)] mb-4" />
          <p className="font-medium text-lg">Aucune catégorie trouvée</p>
          <p className="text-sm">Ajoutez une catégorie pour commencer</p>
        </div>
      )}

      {/* ── Modals ── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onConfirm={handleSave} confirmText={editCat ? 'Enregistrer' : 'Créer'} confirmVariant="primary" size="sm">
        <div className="flex flex-col gap-4">
          <FormField label="Nom" id="cat-name" error={formErrors.name}><input type="text" value={formData.name} onChange={e => setField('name', e.target.value)} className={inputClass} autoFocus placeholder="ex: Informatique" /></FormField>
          <FormField label="Code unique" id="cat-code" error={formErrors.code}><input type="text" value={formData.code} onChange={e => setField('code', e.target.value)} className={`${inputClass} font-mono`} placeholder="ex: CAT-INF" /></FormField>
          <FormField label="Description" id="cat-desc" error={formErrors.description}><textarea value={formData.description} onChange={e => setField('description', e.target.value)} className={inputClass} rows={3} placeholder="Détails de la catégorie..." /></FormField>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmation de suppression" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Supprimer "{deleteTarget?.name}" ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette action supprimera définitivement cette catégorie. Assurez-vous qu'elle ne contient pas de produits indispensables.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!productsModal} onClose={() => setProductsModal(null)} title={`Produits : ${productsModal?.name}`} showConfirm={false} size="lg">
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] flex justify-between items-center">
            <div>
              <p className="font-semibold text-[var(--fg)]">{productsModal?.name}</p>
              <p className="text-xs text-[var(--fg-muted)]">{productsModal?.description}</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 font-bold text-sm rounded-lg">{productsModal?.productCount} produits</span>
          </div>
          
          <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-subtle)] sticky top-0 z-10">
                <tr><th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Produit</th><th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Stock</th><th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Prix</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                {products.filter(p => p.category === productsModal?.name).map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-[var(--fg)]">{p.name}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${p.stock <= 0 ? 'text-red-500' : p.stock < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>{p.stock}</span></td>
                    <td className="px-4 py-3 text-[var(--fg-muted)]">{p.price} DT</td>
                  </tr>
                ))}
                {products.filter(p => p.category === productsModal?.name).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--fg-muted)]">Aucun produit dans cette catégorie</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={() => { setProductsModal(null); navigate('/stock/products?category=' + encodeURIComponent(productsModal.name)) }} className="mt-2 w-full flex items-center justify-center h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-500/20 transition-colors">
            Ouvrir dans Produits →
          </button>
        </div>
      </Modal>
    </div>
  )
}
