import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Pencil, Trash2, Search, SlidersHorizontal, X, AlertTriangle } from 'lucide-react'
import productService from '../../../services/productService'
import categoryService from '../../../services/categoryService'
import supplierService from '../../../services/supplierService'
import { extractApiErrorMessage, mapProductToUi, mapCategoryToUi, mapSupplierToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import StatusBadge from '../../../components/common/StatusBadge'

const STATUS = { IN_STOCK: 'en stock', LOW_STOCK: 'stock faible', OUT_OF_STOCK: 'rupture' }
const getStatus = (stock) => {
  const s = Number(stock)
  if (s <= 0) return STATUS.OUT_OF_STOCK
  if (s < 10) return STATUS.LOW_STOCK
  return STATUS.IN_STOCK
}

const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats]         = useState({ totalProducts: 0, totalValue: 0, lowStock: 0, outOfStock: 0 })
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formData, setFormData]   = useState({ name: '', sku: '', category: '', stock: '', price: '', supplierId: '' })
  const [formErrors, setFormErrors] = useState({})
  const [filters, setFilters]     = useState({ name: '', category: '', status: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, catRes, suppRes, statsRes] = await Promise.all([
        productService.getAll({ limit: 500 }),
        categoryService.getAll({ limit: 200 }),
        supplierService.getAll({ limit: 200 }),
        productService.getStats(),
      ])
      const mapped = pickList(prodRes, ['products', 'data']).map(p => ({ ...mapProductToUi(p), status: getStatus(p.stock) }))
      setProducts(mapped)
      setCategories(pickList(catRes, ['categories', 'data']).map(mapCategoryToUi))
      setSuppliers(pickList(suppRes, ['suppliers', 'data']).map(mapSupplierToUi))
      setStats(statsRes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const cat = searchParams.get('category')
    const sup = searchParams.get('supplier')
    if (cat) setFilters(f => ({ ...f, category: cat }))
    if (sup) setFilters(f => ({ ...f, supplierId: sup }))
    if (cat || sup) setShowFilters(true)
  }, [searchParams])

  const filtered = useMemo(() => products.filter(p =>
    (!filters.name     || p.name.toLowerCase().includes(filters.name.toLowerCase())) &&
    (!filters.category || p.category === filters.category) &&
    (!filters.status   || p.status === filters.status)
  ), [products, filters])

  const resetForm = useCallback(() => {
    setFormData({ name: '', sku: '', category: '', stock: '', price: '', supplierId: '' })
    setEditProduct(null)
    setFormErrors({})
  }, [])

  const openAdd  = ()  => { resetForm(); setModalOpen(true) }
  const openEdit = (p) => {
    setEditProduct(p)
    setFormData({ name: p.name, sku: p.code, category: p.category, stock: String(p.stock), price: String(p.price), supplierId: p.supplierId })
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim())    e.name = 'Nom requis'
    if (!formData.sku.trim())     e.sku = 'Code unique requis (ex: CA-145)'
    if (!formData.category)       e.category = 'Catégorie requise'
    if (!formData.supplierId)     e.supplierId = 'Fournisseur requis'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const payload = { name: formData.name, sku: formData.sku, category: formData.category, stock: formData.stock, price: formData.price, supplierId: formData.supplierId }
      if (editProduct) {
        await productService.update(editProduct.id, payload)
      } else {
        await productService.create(payload)
      }
      await loadData()
      resetForm()
      setModalOpen(false)
    } catch (e) { window.alert(extractApiErrorMessage(e, "Erreur lors de l'opération")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await productService.delete(deleteTarget.id)
      await loadData()
      setDeleteTarget(null)
    } catch (e) { window.alert(extractApiErrorMessage(e, 'Erreur lors de la suppression')) }
  }

  const setField = (k, v) => {
    setFormData(f => ({ ...f, [k]: v }))
    setFormErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Produits</h1>
            <p className="text-xs text-[var(--fg-muted)]">{products.length} produit{products.length !== 1 ? 's' : ''} au total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-all ${
              showFilters
                ? 'bg-indigo-500/12 border-indigo-500/25 text-indigo-600 dark:text-indigo-400'
                : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px"
          >
            <Plus size={16} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total produits',   value: stats.totalProducts,                             color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
          { label: 'Stock faible',     value: stats.lowStock,                                  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
          { label: 'Rupture de stock', value: stats.outOfStock,                                color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
          { label: 'Valeur totale',    value: `${(stats.totalValue || 0).toLocaleString()} DT`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(s => (
          <div
            key={s.label}
            className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background: s.bg }}>
              <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[var(--fg)] leading-none truncate">{s.value}</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters Panel ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Nom du produit</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
                  <input type="text" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                    className="form-input pl-8 h-9" placeholder="Rechercher..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Catégorie</label>
                <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="">Toutes les catégories</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Statut du stock</label>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="">Tous</option>
                  <option value={STATUS.IN_STOCK}>En stock</option>
                  <option value={STATUS.LOW_STOCK}>Stock faible</option>
                  <option value={STATUS.OUT_OF_STOCK}>Rupture</option>
                </select>
              </div>
              {(filters.name || filters.category || filters.status) && (
                <button
                  onClick={() => setFilters({ name: '', category: '', status: '' })}
                  className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors col-span-full"
                >
                  <X size={12} /> Effacer les filtres
                </button>
              )}
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
                {['Code', 'Produit', 'Catégorie', 'Fournisseur', 'Stock', 'Prix', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-[12px] font-bold text-indigo-500 bg-indigo-500/8 px-2 py-0.5 rounded">
                        {p.code || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[var(--fg)] max-w-[180px] truncate block">{p.name}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-[13px] text-[var(--fg-muted)]">{p.category || '—'}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-[13px] text-[var(--fg-muted)]">
                        {suppliers.find(s => s.id === p.supplierId)?.name || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`font-bold text-sm ${
                        p.stock <= 0 ? 'text-red-500' :
                        p.stock < 10 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[var(--fg)]">{Number(p.price).toLocaleString()} DT</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--fg-muted)] hover:text-indigo-500 hover:bg-indigo-500/8 transition-all"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--fg-muted)] hover:text-red-500 hover:bg-red-500/8 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <Package size={28} className="text-[var(--fg-subtle)]" />
                      <p className="font-medium">Aucun produit trouvé</p>
                      <button onClick={openAdd} className="text-xs text-indigo-500 hover:underline mt-1">
                        Ajouter un produit
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <span className="text-xs text-[var(--fg-muted)]">
            <span className="font-semibold text-[var(--fg)]">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== products.length && ` sur ${products.length}`}
          </span>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm() }}
        title={editProduct ? 'Modifier le produit' : 'Nouveau produit'}
        onConfirm={handleSave}
        confirmText={editProduct ? 'Enregistrer' : 'Ajouter'}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Nom <span className="text-red-500">*</span></label>
              <input type="text" value={formData.name} onChange={e => setField('name', e.target.value)}
                className={`${inputClass} ${formErrors.name ? 'border-red-500 focus:border-red-500' : ''}`} placeholder="Nom du produit" />
              {formErrors.name && <p className="text-[11px] text-red-500">{formErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Code unique <span className="text-red-500">*</span></label>
              <input type="text" value={formData.sku} onChange={e => setField('sku', e.target.value)}
                className={`${inputClass} font-mono ${formErrors.sku ? 'border-red-500 focus:border-red-500' : ''}`} placeholder="ex: CA-145" />
              {formErrors.sku && <p className="text-[11px] text-red-500">{formErrors.sku}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Catégorie <span className="text-red-500">*</span></label>
              <select value={formData.category} onChange={e => setField('category', e.target.value)}
                className={`${selectClass} ${formErrors.category ? 'border-red-500' : ''}`}>
                <option value="">Sélectionner</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {formErrors.category && <p className="text-[11px] text-red-500">{formErrors.category}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Fournisseur <span className="text-red-500">*</span></label>
              <select value={formData.supplierId} onChange={e => setField('supplierId', e.target.value)}
                className={`${selectClass} ${formErrors.supplierId ? 'border-red-500' : ''}`}>
                <option value="">Sélectionner</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {formErrors.supplierId && <p className="text-[11px] text-red-500">{formErrors.supplierId}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Stock</label>
              <input type="number" min="0" value={formData.stock} onChange={e => setField('stock', e.target.value)}
                className={inputClass} placeholder="0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Prix (DT)</label>
              <input type="number" min="0" step="0.01" value={formData.price} onChange={e => setField('price', e.target.value)}
                className={inputClass} placeholder="0.00" />
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
        onConfirm={handleDelete}
        confirmText="Supprimer"
        confirmVariant="danger"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">
              Supprimer "{deleteTarget?.name}" ?
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}