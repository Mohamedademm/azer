import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Plus, Trash2, Mail, Phone, MapPin, ExternalLink, Pencil, AlertTriangle, CheckCircle, ShoppingBag, Calendar, Activity } from 'lucide-react'
import { clientService } from '../../../services/clientService'
import { buildCustomerPayload, extractApiErrorMessage, mapCustomerToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'

export default function ClientsPage({ showNotif }) {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI States
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ isOpen: false, mode: 'add', item: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })
  
  const [cForm, setCForm] = useState({ siret: '', name: '', email: '', phone: '', address: '', status: 'actif' })
  const [formErrors, setFormErrors] = useState({})

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientService.getAll({ limit: 200 })
      setClients(pickList(res, ['data']).map(mapCustomerToUi))
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de charger les clients')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredClients = useMemo(() =>
    clients.filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.siret || '').includes(search)
    ), [clients, search])

  const openModal = (mode, item = null) => {
    if (item && mode === 'edit') setCForm(item)
    else setCForm({ siret: '', name: '', email: '', phone: '', address: '', status: 'actif' })
    setModal({ isOpen: true, mode, item })
    setFormErrors({})
  }

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'add', item: null })
    setCForm({ siret: '', name: '', email: '', phone: '', address: '', status: 'actif' })
    setFormErrors({})
  }

  const validate = () => {
    const e = {}
    if (!cForm.name.trim()) e.name = 'Nom requis'
    if (!cForm.siret.trim()) e.siret = 'CIN / SIRET requis'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      if (modal.mode === 'add') {
        await clientService.create(buildCustomerPayload(cForm))
        notify('success', 'Client ajouté avec succès')
      } else {
        await clientService.update(modal.item.id, buildCustomerPayload(cForm, modal.item))
        notify('success', 'Client modifié avec succès')
      }
      await loadData()
      closeModal()
    } catch (err) { notify('error', extractApiErrorMessage(err, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await clientService.delete(deleteTarget.id)
      await loadData()
      notify('success', 'Client supprimé')
      setDeleteTarget(null)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur de suppression')) }
  }

  const setField = (k, v) => {
    setCForm(f => ({ ...f, [k]: v }))
    setFormErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const formatCurrency = a => (a || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }).replace('TND', 'DT')
  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

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
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Annuaire Clients</h1>
            <p className="text-xs text-[var(--fg-muted)]">Gérez vos contacts et consultez leur historique</p>
          </div>
        </div>
        <button onClick={() => openModal('add')} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all hover:-translate-y-px">
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} placeholder="Rechercher par nom, email ou CIN..." />
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-[280px] rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />)}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClients.map(c => (
            <div key={c.id} className="group flex flex-col p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-1">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 font-bold text-lg border border-blue-500/10">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--fg)] text-sm line-clamp-1" title={c.name}>{c.name}</h3>
                    <p className="text-[11px] font-mono text-[var(--fg-subtle)] mt-0.5" title="CIN / SIRET">{c.siret || '—'}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.status === 'actif' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)] border-[var(--border)]'}`}>
                  {c.status}
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                  <Mail size={12} className="text-[var(--fg-subtle)]" />
                  <span className="truncate">{c.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                  <Phone size={12} className="text-[var(--fg-subtle)]" />
                  <span className="truncate">{c.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                  <MapPin size={12} className="text-[var(--fg-subtle)]" />
                  <span className="truncate">{c.address || '—'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[var(--bg-subtle)] mb-5">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[var(--fg-subtle)] mb-1 flex items-center gap-1"><ShoppingBag size={10} /> Cmds</span>
                  <span className="text-sm font-bold text-[var(--fg)]">{c.totalOrders || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[var(--fg-subtle)] mb-1 flex items-center gap-1"><Activity size={10} /> Dépensé</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(c.totalSpent)}</span>
                </div>
                <div className="col-span-2 flex flex-col pt-2 border-t border-[var(--border)] mt-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--fg-subtle)] mb-1 flex items-center gap-1"><Calendar size={10} /> Dernière commande</span>
                  <span className="text-xs font-semibold text-[var(--fg-muted)]">{formatDate(c.lastOrder)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-[var(--border)]">
                <button onClick={() => navigate(`/facturation/orders?search=${encodeURIComponent(c.name)}`)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                  <ExternalLink size={14} /> Voir commandes
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal('edit', c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors" title="Modifier"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteTarget(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--fg-muted)]">
          <Users size={40} className="text-[var(--border)] mb-4" />
          <p className="font-medium text-lg">Aucun client trouvé</p>
          <p className="text-sm">Ajoutez un nouveau client pour commencer.</p>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.mode === 'add' ? 'Nouveau client' : 'Modifier le client'} onConfirm={handleSave} confirmText={modal.mode === 'add' ? 'Ajouter' : 'Enregistrer'}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="CIN / SIRET" id="c-siret" error={formErrors.siret}><input type="text" value={cForm.siret} onChange={e => setField('siret', e.target.value)} className={inputClass} autoFocus /></FormField>
            <FormField label="Statut" id="c-status">
              <div className="flex bg-[var(--bg-subtle)] rounded-lg p-1 border border-[var(--border)] mt-1">
                {['actif', 'inactif'].map(s => (
                  <button key={s} type="button" onClick={() => setField('status', s)} className={`flex-1 h-8 text-xs font-semibold capitalize rounded-md transition-all ${cForm.status === s ? 'bg-[var(--bg-card)] shadow text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </FormField>
          </div>
          <FormField label="Nom complet" id="c-name" error={formErrors.name}><input type="text" value={cForm.name} onChange={e => setField('name', e.target.value)} className={inputClass} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" id="c-email"><input type="email" value={cForm.email} onChange={e => setField('email', e.target.value)} className={inputClass} /></FormField>
            <FormField label="Téléphone" id="c-phone"><input type="tel" value={cForm.phone} onChange={e => setField('phone', e.target.value)} className={inputClass} /></FormField>
          </div>
          <FormField label="Adresse" id="c-address"><input type="text" value={cForm.address} onChange={e => setField('address', e.target.value)} className={inputClass} /></FormField>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le client" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette action supprimera le client et pourrait affecter l'historique de facturation lié.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
