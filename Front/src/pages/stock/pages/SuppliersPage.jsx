import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Plus, Pencil, Trash2, Search, SlidersHorizontal, X, Star, Mail, Phone, MapPin, Package, AlertTriangle } from 'lucide-react'
import supplierService from '../../../services/supplierService'
import productService from '../../../services/productService'
import { extractApiErrorMessage, mapSupplierToUi, mapProductToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'

const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} className={i <= rating ? "fill-amber-400 text-amber-400" : "fill-[var(--bg-subtle)] text-[var(--border)]"} />
      ))}
    </div>
  )
}

export default function SuppliersPage() {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editSupp, setEditSupp]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [productsModal, setProductsModal] = useState(null)

  // Form state
  const [formData, setFormData]   = useState({ name: '', code: '', contact: '', email: '', phone: '', address: '', status: 'actif', rating: 4 })
  const [formErrors, setFormErrors] = useState({})
  const [filters, setFilters]     = useState({ name: '', status: '', rating: '' })
  const [toastMsg, setToastMsg]   = useState({ type: '', text: '' })

  const showToast = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [suppRes, prodRes] = await Promise.all([
        supplierService.getAll({ limit: 200 }),
        productService.getAll({ limit: 200 }),
      ])
      setSuppliers(pickList(suppRes, ['suppliers', 'data']).map(mapSupplierToUi))
      setProducts(pickList(prodRes, ['products', 'data']).map(mapProductToUi))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = useMemo(() => suppliers.filter(s =>
    (!filters.name || s.name.toLowerCase().includes(filters.name.toLowerCase())) &&
    (!filters.status || s.status === filters.status) &&
    (!filters.rating || s.rating >= parseFloat(filters.rating))
  ), [suppliers, filters])

  const resetForm = () => {
    setFormData({ name: '', code: '', contact: '', email: '', phone: '', address: '', status: 'actif', rating: 4 })
    setEditSupp(null)
    setFormErrors({})
  }

  const openAdd = () => { resetForm(); setModalOpen(true) }
  const openEdit = (s) => {
    setEditSupp(s)
    setFormData({ name: s.name, code: s.code, contact: s.contact, email: s.email, phone: s.phone, address: s.address || '', status: s.status, rating: s.rating })
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Nom requis'
    if (!formData.code.trim()) e.code = 'Code requis'
    if (!formData.contact.trim()) e.contact = 'Contact requis'
    if (!formData.email.trim()) e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide'
    if (!formData.phone.trim()) e.phone = 'Téléphone requis'
    if (formData.rating < 1 || formData.rating > 5) e.rating = 'Note entre 1 et 5'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const payload = { ...formData, name: formData.name.trim(), code: formData.code.trim() }
      if (editSupp) {
        await supplierService.update(editSupp.id, payload)
        showToast('success', 'Fournisseur modifié')
      } else {
        await supplierService.create(payload)
        showToast('success', 'Fournisseur ajouté')
      }
      await loadData()
      setModalOpen(false)
    } catch (e) { showToast('error', extractApiErrorMessage(e, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await supplierService.delete(deleteTarget.id)
      await loadData()
      showToast('success', 'Fournisseur supprimé')
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/12 text-orange-500">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Fournisseurs</h1>
            <p className="text-xs text-[var(--fg-muted)]">{suppliers.length} fournisseur(s) enregistrés</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-all ${
              showFilters
                ? 'bg-orange-500/12 border-orange-500/25 text-orange-600 dark:text-orange-400'
                : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <SlidersHorizontal size={14} /> Filtres
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-sm shadow-orange-500/25 transition-all hover:-translate-y-px"
          >
            <Plus size={16} /> Nouveau fournisseur
          </button>
        </div>
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
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Nom du fournisseur</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
                  <input type="text" value={filters.name} onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                    className="form-input pl-8 h-9" placeholder="Rechercher..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Statut</label>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Note minimale</label>
                <select value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))} className={`${selectClass} h-9`}>
                  <option value="">Toutes les notes</option>
                  <option value="5">5 étoiles</option>
                  <option value="4">4+ étoiles</option>
                  <option value="3">3+ étoiles</option>
                </select>
              </div>
              {(filters.name || filters.status || filters.rating) && (
                <button
                  onClick={() => setFilters({ name: '', status: '', rating: '' })}
                  className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors col-span-full"
                >
                  <X size={12} /> Effacer les filtres
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className={`group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-1 ${s.status === 'inactif' ? 'opacity-75 grayscale-[20%]' : ''}`}>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-white ${s.status === 'actif' ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-slate-400'}`}>
                      <span className="text-lg font-bold">{s.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--fg)] text-base">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <RatingStars rating={s.rating} />
                        <span className="text-[10px] font-semibold bg-[var(--bg-subtle)] text-[var(--fg-muted)] px-1.5 py-0.5 rounded-full">{s.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${s.status === 'actif' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-[var(--bg-subtle)] text-[var(--fg-subtle)] border border-[var(--border)]'}`}>
                      {s.status}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(s)} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-subtle)] hover:bg-orange-500 hover:text-white transition-colors text-[var(--fg-muted)]"><Pencil size={12} /></button>
                      <button onClick={() => setDeleteTarget(s)} className="w-6 h-6 flex items-center justify-center rounded bg-[var(--bg-subtle)] hover:bg-red-500 hover:text-white transition-colors text-[var(--fg-muted)]"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]"><Mail size={14} className="text-[var(--fg-subtle)]" /> <a href={`mailto:${s.email}`} className="hover:text-orange-500 hover:underline truncate">{s.email}</a></div>
                  <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]"><Phone size={14} className="text-[var(--fg-subtle)]" /> <span>{s.phone}</span></div>
                  {s.address && <div className="flex items-start gap-2 text-sm text-[var(--fg-muted)]"><MapPin size={14} className="text-[var(--fg-subtle)] mt-0.5 shrink-0" /> <span className="line-clamp-2">{s.address}</span></div>}
                </div>
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--bg-subtle)] px-5 py-3 rounded-b-2xl flex items-center justify-between">
                <span className="text-xs text-[var(--fg-subtle)]">Contact : <strong className="text-[var(--fg-muted)]">{s.contact}</strong></span>
                <button
                  onClick={() => setProductsModal(s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <Package size={14} /> {s.products || 0} produit(s)
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--fg-muted)]">
          <Truck size={40} className="text-[var(--border)] mb-4" />
          <p className="font-medium text-lg">Aucun fournisseur trouvé</p>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editSupp ? 'Modifier fournisseur' : 'Nouveau fournisseur'} onConfirm={handleSave} confirmText={editSupp ? 'Enregistrer' : 'Créer'} confirmVariant="primary" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nom de l'entreprise" id="supp-name" error={formErrors.name}><input type="text" value={formData.name} onChange={e => setField('name', e.target.value)} className={inputClass} placeholder="Entreprise SA" /></FormField>
          <FormField label="Code unique" id="supp-code" error={formErrors.code}><input type="text" value={formData.code} onChange={e => setField('code', e.target.value)} className={`${inputClass} font-mono`} placeholder="F-123" /></FormField>
          
          <FormField label="Contact principal" id="supp-contact" error={formErrors.contact}><input type="text" value={formData.contact} onChange={e => setField('contact', e.target.value)} className={inputClass} placeholder="Nom du contact" /></FormField>
          <FormField label="Email" id="supp-email" error={formErrors.email}><input type="email" value={formData.email} onChange={e => setField('email', e.target.value)} className={inputClass} placeholder="contact@entreprise.com" /></FormField>
          
          <FormField label="Téléphone" id="supp-phone" error={formErrors.phone}><input type="tel" value={formData.phone} onChange={e => setField('phone', e.target.value)} className={inputClass} placeholder="+xxx xx xxx xxx" /></FormField>
          <FormField label="Note (1-5)" id="supp-rating" error={formErrors.rating}><input type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={e => setField('rating', e.target.value)} className={inputClass} /></FormField>
          
          <FormField label="Statut" id="supp-status">
            <select value={formData.status} onChange={e => setField('status', e.target.value)} className={selectClass}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Adresse complète" id="supp-address"><textarea value={formData.address} onChange={e => setField('address', e.target.value)} className={inputClass} rows={2} placeholder="Rue, Ville, Pays..." /></FormField>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmation de suppression" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Supprimer "{deleteTarget?.name}" ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Action irréversible. Vérifiez l'impact sur vos stocks.</p>
          </div>
        </div>
      </Modal>

      {/* ── Products List Modal ── */}
      <Modal isOpen={!!productsModal} onClose={() => setProductsModal(null)} title={`Produits fournis par ${productsModal?.name}`} showConfirm={false} size="lg">
        <div className="flex flex-col gap-4">
          <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-subtle)] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Produit</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Catégorie</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                {products.filter(p => p.supplierId === productsModal?.id).map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-[var(--fg)]">{p.name}</td>
                    <td className="px-4 py-3 text-[var(--fg-muted)]">{p.category}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${p.stock <= 0 ? 'text-red-500' : 'text-emerald-500'}`}>{p.stock}</span></td>
                  </tr>
                ))}
                {products.filter(p => p.supplierId === productsModal?.id).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-[var(--fg-muted)]">Aucun produit associé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={() => { navigate('/stock/products?supplier=' + encodeURIComponent(productsModal.id)); setProductsModal(null) }} className="mt-2 w-full flex items-center justify-center h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-500/20 transition-colors">
            Voir dans Produits →
          </button>
        </div>
      </Modal>
    </div>
  )
}
