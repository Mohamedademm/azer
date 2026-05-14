import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Landmark, PiggyBank, Receipt, Scale, TrendingUp, TrendingDown, Plus, Pencil, Trash2, ArrowRight, AlertTriangle } from 'lucide-react'
import { accountService } from '../../../services/accountService'
import { extractApiErrorMessage, mapAccountToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const ACCOUNT_TYPES = ['Banque', 'Caisse', 'Epargne', 'Creance', 'Dette', 'Produit', 'Charge']
const EMPTY_ACCOUNT = { name: '', type: 'Banque', number: '', iban: '', bic: '', balance: '', status: 'actif', inMoneyFlow: false }
const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'

const getAccountIcon = (type) => {
  switch (type) {
    case 'Banque': return <Landmark size={20} className="text-blue-500" />
    case 'Caisse': return <Wallet size={20} className="text-emerald-500" />
    case 'Epargne': return <PiggyBank size={20} className="text-purple-500" />
    case 'Creance': return <TrendingUp size={20} className="text-teal-500" />
    case 'Dette': return <TrendingDown size={20} className="text-red-500" />
    case 'Produit': return <Receipt size={20} className="text-amber-500" />
    case 'Charge': return <Scale size={20} className="text-orange-500" />
    default: return <Landmark size={20} className="text-[var(--fg-muted)]" />
  }
}

const getAccountBg = (type) => {
  switch (type) {
    case 'Banque': return 'bg-blue-500/10'
    case 'Caisse': return 'bg-emerald-500/10'
    case 'Epargne': return 'bg-purple-500/10'
    case 'Creance': return 'bg-teal-500/10'
    case 'Dette': return 'bg-red-500/10'
    case 'Produit': return 'bg-amber-500/10'
    case 'Charge': return 'bg-orange-500/10'
    default: return 'bg-[var(--bg-subtle)]'
  }
}

export default function AccountsPage({ showNotif }) {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({ ...EMPTY_ACCOUNT })
  const [formErrors, setFormErrors] = useState({})
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await accountService.getAll({ limit: 200 })
      setAccounts(pickList(res, ['data']).map(mapAccountToUi))
    } catch (error) { notify('error', extractApiErrorMessage(error, 'Impossible de charger les comptes')) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const resetForm = () => {
    setFormData({ ...EMPTY_ACCOUNT })
    setEditAccount(null)
    setFormErrors({})
  }

  const openAdd = () => { resetForm(); setModalOpen(true) }
  const openEdit = (acc) => {
    setEditAccount(acc)
    setFormData({ ...acc, balance: (acc.capital ?? acc.balance ?? 0).toString() })
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Nom requis'
    if (formData.balance === '') e.balance = 'Capital initial requis'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) return setFormErrors(e)
    try {
      const payload = { ...formData, inMoneyFlow: Boolean(formData.inMoneyFlow) }
      if (editAccount) {
        const targetId = editAccount.backendId || editAccount.id
        await accountService.update(targetId, payload)
        notify('success', 'Compte modifié')
      } else {
        await accountService.create(payload)
        notify('success', 'Compte créé')
      }
      await loadData()
      setModalOpen(false)
    } catch (error) { notify('error', extractApiErrorMessage(error, "Erreur d'enregistrement")) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const targetId = deleteTarget.backendId || deleteTarget.id
      await accountService.delete(targetId)
      await loadData()
      notify('success', 'Compte supprimé')
      setDeleteTarget(null)
    } catch (error) { notify('error', extractApiErrorMessage(error, 'Erreur de suppression')) }
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
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Comptes financiers</h1>
            <p className="text-xs text-[var(--fg-muted)]">Gérez vos banques, caisses et trésorerie</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px">
          <Plus size={16} /> Nouveau compte
        </button>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map(a => (
            <div key={a.id} className={`group relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-1 ${a.status === 'inactif' ? 'opacity-75 grayscale-[20%]' : ''}`}>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${getAccountBg(a.type)}`}>
                      {getAccountIcon(a.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--fg)] text-base line-clamp-1" title={a.name}>{a.name}</h3>
                      <p className="text-[11px] font-mono text-[var(--fg-subtle)]">{a.number || 'Aucun numéro'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${a.status === 'actif' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-[var(--bg-subtle)] text-[var(--fg-subtle)] border border-[var(--border)]'}`}>
                      {a.status}
                    </span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[var(--fg-subtle)] uppercase tracking-wider mb-1">Capital Initial</span>
                    <span className="text-sm font-semibold text-[var(--fg-muted)]">{formatCurrency(a.capital)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold text-[var(--fg-subtle)] uppercase tracking-wider mb-1">Solde Actuel</span>
                    <span className={`text-base font-bold ${a.solde >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(a.solde)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--bg-subtle)] p-3 rounded-b-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--fg-muted)] px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">{a.type}</span>
                  {a.inMoneyFlow && <span className="font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">Money Flow</span>}
                </div>
                {a.iban && <div className="text-[10px] font-mono text-[var(--fg-subtle)] bg-[var(--bg-card)] px-2 py-1.5 rounded border border-[var(--border)] truncate" title={a.iban}>IBAN: {a.iban}</div>}
                
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors text-[var(--fg-muted)]" title="Modifier"><Pencil size={12} /></button>
                    <button onClick={() => setDeleteTarget(a)} className="w-7 h-7 flex items-center justify-center rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-[var(--fg-muted)]" title="Supprimer"><Trash2 size={12} /></button>
                  </div>
                  <button
                    onClick={() => {
                      if (a.name === 'Compte Revenu') navigate('/finance/transactions')
                      else if (a.name === 'Compte Dépenses') navigate(`/finance/depenses?account=${encodeURIComponent(a.id)}`)
                      else navigate(`/finance/transactions?account=${encodeURIComponent(a.id)}`)
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                  >
                    Voir transactions <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--fg-muted)]">
          <Wallet size={40} className="text-[var(--border)] mb-4" />
          <p className="font-medium text-lg">Aucun compte financier</p>
          <p className="text-sm">Commencez par ajouter votre banque ou caisse.</p>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title={editAccount ? 'Modifier le compte' : 'Nouveau compte'} onConfirm={handleSave} confirmText={editAccount ? 'Enregistrer' : 'Créer'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Nom du compte" id="acc-name" error={formErrors.name}><input type="text" value={formData.name} onChange={e => setField('name', e.target.value)} className={inputClass} placeholder="ex: Caisse principale" autoFocus /></FormField>
          </div>
          
          <FormField label="Type de compte" id="acc-type">
            <select value={formData.type} onChange={e => setField('type', e.target.value)} className={selectClass}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          
          <FormField label="Capital initial (DT)" id="acc-balance" error={formErrors.balance}>
            <input type="number" step="0.01" value={formData.balance} onChange={e => setField('balance', e.target.value)} className={`${inputClass} font-mono`} placeholder="0.00" />
            <p className="text-[10px] text-[var(--fg-subtle)] mt-1 font-medium">Le solde final inclura les transactions.</p>
          </FormField>
          
          <FormField label="Numéro de compte" id="acc-num"><input type="text" value={formData.number} onChange={e => setField('number', e.target.value)} className={`${inputClass} font-mono`} placeholder="Optionnel" /></FormField>
          <FormField label="Statut" id="acc-status">
            <select value={formData.status} onChange={e => setField('status', e.target.value)} className={selectClass}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </FormField>
          
          <div className="sm:col-span-2 grid grid-cols-2 gap-4">
            <FormField label="IBAN" id="acc-iban"><input type="text" value={formData.iban} onChange={e => setField('iban', e.target.value)} className={`${inputClass} font-mono uppercase`} placeholder="Optionnel" /></FormField>
            <FormField label="BIC/SWIFT" id="acc-bic"><input type="text" value={formData.bic} onChange={e => setField('bic', e.target.value)} className={`${inputClass} font-mono uppercase`} placeholder="Optionnel" /></FormField>
          </div>
          
          <div className="sm:col-span-2 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
              <input type="checkbox" checked={formData.inMoneyFlow} onChange={e => setField('inMoneyFlow', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-[var(--border)] bg-[var(--bg-card)] focus:ring-indigo-600 focus:ring-offset-[var(--bg-subtle)]" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--fg)]">Inclure dans le Money Flow</span>
                <span className="text-[11px] text-[var(--fg-muted)]">Cocher pour que ce compte soit pris en compte dans les statistiques globales de trésorerie.</span>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le compte" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Cette action supprimera le compte "{deleteTarget?.name}". Les transactions associées pourraient être affectées.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
