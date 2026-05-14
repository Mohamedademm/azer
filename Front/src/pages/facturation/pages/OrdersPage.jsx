import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Search, Plus, Trash2, Calendar, FileText, ExternalLink, Pencil, AlertTriangle, CheckCircle, Package, User } from 'lucide-react'
import { orderService } from '../../../services/orderService'
import { clientService } from '../../../services/clientService'
import { invoiceService } from '../../../services/invoiceService'
import productService from '../../../services/productService'
import { extractApiErrorMessage, mapOrderToUi, mapInvoiceToUi, mapProductToUi, mapCustomerToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'

const ORDER_STATUSES = ['en attente', 'validée', 'payée', 'livrée', 'annulée']

export default function OrdersPage({ showNotif }) {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI States
  const [filters, setFilters] = useState({ date: { start: '', end: '' }, search: initialSearch })
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', item: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })
  
  const [oForm, setOForm] = useState({ client: '', items: [{ product: '', quantity: 1, unitPrice: 0 }], status: 'en attente', expectedDate: '', notes: '' })
  const [formErrors, setFormErrors] = useState({})

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, clientsRes, invoicesRes, productsRes] = await Promise.all([
        orderService.getAll({ limit: 200 }),
        clientService.getAll({ limit: 200 }),
        invoiceService.getAll({ limit: 200 }),
        productService.getAll({ limit: 200 }),
      ])
      const invoiceItems = pickList(invoicesRes, ['data']).map(mapInvoiceToUi)
      const invoiceByOrderId = new Map(invoiceItems.filter(inv => inv.orderId).map(inv => [inv.orderId, inv]))
      setOrders(pickList(ordersRes, ['data']).map(o => mapOrderToUi(o, invoiceByOrderId)))
      setClients(pickList(clientsRes, ['data']).map(mapCustomerToUi))
      setProducts(pickList(productsRes, ['products', 'data']).map(mapProductToUi))
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de charger les commandes')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredOrders = useMemo(() =>
    orders.filter(o =>
      (!filters.date.start || o.date >= filters.date.start) &&
      (!filters.date.end || o.date <= filters.date.end) &&
      (!filters.search || o.id.toLowerCase().includes(filters.search.toLowerCase()) || o.client.toLowerCase().includes(filters.search.toLowerCase()))
    ).sort((a, b) => new Date(b.date) - new Date(a.date)), [orders, filters])

  const openModal = (mode, item = null) => {
    if (item && mode === 'edit') {
      setOForm({
        client: item.customerId || item.client,
        items: item.backend?.items?.map(i => ({ product: typeof i.product === 'object' ? i.product._id : i.product, quantity: i.quantity, unitPrice: i.unitPrice })) || [{ product: '', quantity: 1, unitPrice: 0 }],
        status: item.status,
        expectedDate: item.backend?.expectedDate ? item.backend.expectedDate.split('T')[0] : '',
        notes: item.backend?.notes || '',
      })
    } else {
      setOForm({ client: '', items: [{ product: '', quantity: 1, unitPrice: 0 }], status: 'en attente', expectedDate: '', notes: '' })
    }
    setModal({ isOpen: true, mode, item })
    setFormErrors({})
  }

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', item: null })
    setOForm({ client: '', items: [{ product: '', quantity: 1, unitPrice: 0 }], status: 'en attente', expectedDate: '', notes: '' })
    setFormErrors({})
  }

  const handleSave = async () => {
    if (!oForm.client) return notify('error', 'Veuillez sélectionner un client')
    if (oForm.items.some(i => !i.product)) return notify('error', 'Veuillez sélectionner un produit pour tous les articles')
    
    try {
      if (modal.mode === 'add') {
        await orderService.create({
          type: 'vente',
          customer: oForm.client,
          items: oForm.items.map(i => ({ product: i.product, quantity: parseInt(i.quantity) || 1, unitPrice: parseFloat(i.unitPrice) || 0 })),
          expectedDate: oForm.expectedDate || null,
          notes: oForm.notes || '',
        })
        notify('success', 'Commande créée avec succès')
      } else {
        await orderService.update(modal.item.backendId || modal.item.id, {
          expectedDate: oForm.expectedDate || null,
          notes: oForm.notes || '',
          status: oForm.status,
          items: oForm.items.map(i => ({ product: i.product, quantity: parseInt(i.quantity) || 1, unitPrice: parseFloat(i.unitPrice) || 0 })),
        })
        notify('success', 'Commande modifiée avec succès')
      }
      await loadData()
      closeModal()
    } catch (err) { notify('error', extractApiErrorMessage(err, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await orderService.delete(deleteTarget.backendId || deleteTarget.id)
      await loadData()
      notify('success', 'Commande supprimée')
      setDeleteTarget(null)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur de suppression')) }
  }

  const handleGenerateInvoice = async (order) => {
    if (!order?.customerId) return notify('error', 'Client introuvable sur cette commande')
    const backendItems = order?.backend?.items
    if (!Array.isArray(backendItems) || backendItems.length === 0) return notify('error', 'La commande ne contient aucun article')
    try {
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const items = backendItems.map(item => ({
        product: item.product?._id || item.product,
        description: item.description || item.product?.name || 'Article',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 20,
        discount: item.discount || 0,
      }))
      await invoiceService.create({ customer: order.customerId, items, dueDate, orderId: order.id, notes: `Facture générée depuis la commande ${order.id}` })
      await loadData()
      notify('success', `Facture générée pour la commande ${order.id}`)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de générer la facture')) }
  }

  const formatCurrency = a => (a || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }).replace('TND', 'DT')
  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="flex flex-col gap-6">
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/12 text-orange-500">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Commandes</h1>
            <p className="text-xs text-[var(--fg-muted)]">Gérez les bons de commande de vos clients</p>
          </div>
        </div>
        <button onClick={() => openModal('add')} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/25 transition-all hover:-translate-y-px">
          <Plus size={16} /> Nouvelle commande
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative max-w-md flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
          <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className={`${inputClass} pl-9`} placeholder="Rechercher par N° ou client..." />
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1">
          <input type="date" value={filters.date.start} onChange={e => setFilters(f => ({ ...f, date: { ...f.date, start: e.target.value } }))} className="h-7 text-xs bg-transparent border-none outline-none px-2 text-[var(--fg-muted)]" />
          <span className="text-[var(--fg-subtle)] text-xs font-semibold">à</span>
          <input type="date" value={filters.date.end} onChange={e => setFilters(f => ({ ...f, date: { ...f.date, end: e.target.value } }))} className="h-7 text-xs bg-transparent border-none outline-none px-2 text-[var(--fg-muted)]" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {['N° Commande', 'Date', 'Client', 'Articles', 'Total TTC', 'Statut', 'Paiement', 'Facture', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(9)].map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" /></td>)}
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-[12px] font-bold text-[var(--fg)]">{o.id}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="text-[13px] text-[var(--fg-muted)] flex items-center gap-1.5"><Calendar size={12} /> {formatDate(o.date)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--fg)] flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] text-[var(--fg-muted)] uppercase">{o.client?.charAt(0)}</div>{o.client}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-bold text-[13px] text-[var(--fg-muted)] flex items-center gap-1"><Package size={12} /> {o.items}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-bold text-[14px] text-[var(--fg)]">{formatCurrency(o.total)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        o.status === 'validée' || o.status === 'livrée' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        o.status === 'annulée' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        o.paymentStatus === 'payée' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>{o.paymentStatus}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {o.invoiceId ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><FileText size={12} /> {o.invoiceId}</span>
                      ) : (
                        <button onClick={() => handleGenerateInvoice(o)} className="h-7 px-2.5 flex items-center gap-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors" title="Générer facture"><Plus size={12} /> Générer</button>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={() => openModal('edit', o)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors" title="Modifier"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(o)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <ShoppingCart size={28} className="text-[var(--border)] mb-2" />
                      <p className="font-medium text-[15px]">Aucune commande trouvée</p>
                      <p className="text-xs">Aucun résultat pour votre recherche.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.mode === 'add' ? 'Nouvelle commande' : 'Modifier la commande'} onConfirm={handleSave} confirmText={modal.mode === 'add' ? 'Ajouter' : 'Enregistrer'} size="xl">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Client" id="o-client">
              {modal.mode === 'edit' ? (
                <input type="text" value={clients.find(c => String(c.id) === String(oForm.client))?.name || (typeof oForm.client === 'string' ? oForm.client : '—')} disabled className={`${inputClass} bg-[var(--bg-subtle)] opacity-70`} />
              ) : (
                <select value={oForm.client} onChange={e => setOForm({ ...oForm, client: e.target.value })} className={selectClass}>
                  <option value="">Sélectionner un client...</option>
                  {clients.filter(c => c.status === 'actif').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </FormField>
            
            <FormField label="Statut de la commande" id="o-status">
              <select value={oForm.status} onChange={e => setOForm({ ...oForm, status: e.target.value })} className={selectClass}>
                {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </FormField>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Articles *</label>
            <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--fg-muted)]">Produit</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--fg-muted)] w-24">Qté</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--fg-muted)] w-32">Prix Unitaire</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--fg-muted)] w-32">Sous-total HT</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {oForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <select value={item.product} onChange={e => { const prod = products.find(p => String(p.id) === e.target.value); const ni = [...oForm.items]; ni[idx] = { ...ni[idx], product: e.target.value, unitPrice: prod ? prod.price : item.unitPrice }; setOForm({ ...oForm, items: ni }) }} className={selectClass}>
                          <option value="">Sélectionner un produit...</option>
                          {products.filter(p => p.status !== 'inactif').map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} en stock)</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="number" min="1" value={item.quantity} onChange={e => { const ni = [...oForm.items]; ni[idx].quantity = e.target.value; setOForm({ ...oForm, items: ni }) }} className={`${inputClass} text-center font-mono`} />
                      </td>
                      <td className="p-2">
                        <input type="number" step="0.01" value={item.unitPrice} onChange={e => { const ni = [...oForm.items]; ni[idx].unitPrice = e.target.value; setOForm({ ...oForm, items: ni }) }} className={`${inputClass} text-right font-mono`} />
                      </td>
                      <td className="p-2 text-right font-bold text-[var(--fg)]">
                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                      </td>
                      <td className="p-2 text-center">
                        {oForm.items.length > 1 && (
                          <button onClick={() => setOForm({ ...oForm, items: oForm.items.filter((_, i) => i !== idx) })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between p-3 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
                <button onClick={() => setOForm({ ...oForm, items: [...oForm.items, { product: '', quantity: 1, unitPrice: 0 }] })} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"><Plus size={14} /> Ajouter un produit</button>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--fg-subtle)] uppercase">Total TTC estimé :</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(oForm.items.reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0)), 0) * 1.2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date prévue de livraison (Optionnel)" id="o-date">
              <input type="date" value={oForm.expectedDate} onChange={e => setOForm({ ...oForm, expectedDate: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Notes et instructions" id="o-notes">
              <textarea value={oForm.notes} onChange={e => setOForm({ ...oForm, notes: e.target.value })} className={inputClass} rows={1} placeholder="Instructions spéciales de livraison..." />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer la commande" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette action est irréversible et supprimera la commande de l'historique.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
