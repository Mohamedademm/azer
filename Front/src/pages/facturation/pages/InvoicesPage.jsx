import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, Download, Archive, CheckCircle, AlertTriangle, FileCheck, Calendar, X, ExternalLink } from 'lucide-react'
import { invoiceService } from '../../../services/invoiceService'
import ArchiveService from '../../../services/ArchiveService'
import { extractApiErrorMessage, mapInvoiceToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'

const inputClass = 'form-input'

const normaliseStatusKey = (status = '') => String(status).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const isPaidStatus = (status = '') => {
  const raw = String(status).toLowerCase()
  const key = normaliseStatusKey(status)
  return raw.startsWith('pay') || key.startsWith('pay')
}

export default function InvoicesPage({ showNotif }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI States
  const [search, setSearch] = useState('')
  const [archiveModal, setArchiveModal] = useState({ isOpen: false, invoice: null })
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await invoiceService.getAll({ limit: 200 })
      setInvoices(pickList(res, ['data']).map(mapInvoiceToUi))
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de charger les factures')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredInvoices = useMemo(() =>
    invoices.filter((invoice) => {
      if (!search) return true
      const term = search.toLowerCase()
      return invoice.id.toLowerCase().includes(term) || invoice.client.toLowerCase().includes(term) || (invoice.orderId || '').toLowerCase().includes(term)
    }).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [invoices, search]
  )

  const handleMarkAsPaid = async (invoice) => {
    try {
      await invoiceService.markAsPaid(invoice.backendId || invoice.id, { paymentMethod: 'virement', amount: Number(invoice.amount) || 0, reference: `UI-${invoice.id}` })
      await loadData()
      notify('success', 'Facture marquée payée')
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de marquer la facture comme payée')) }
  }

  const handleArchive = async () => {
    if (!archiveModal.invoice) return
    try {
      await ArchiveService.archive(archiveModal.invoice.backendId || archiveModal.invoice.id, 'Archivage manuel')
      await loadData()
      notify('success', `Facture archivée`)
      setArchiveModal({ isOpen: false, invoice: null })
    } catch (err) { notify('error', extractApiErrorMessage(err, "Impossible d'archiver la facture")) }
  }

  const handleDownload = async (invoice) => {
    try {
      await invoiceService.downloadPdf(invoice.backendId || invoice.id)
      notify('success', 'Facture téléchargée')
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de télécharger la facture')) }
  }

  const formatCurrency = (amount) => (amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }).replace('TND', 'DT')
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString('fr-FR') : '—')

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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Factures</h1>
            <p className="text-xs text-[var(--fg-muted)]">Gérez vos factures et suivez les paiements</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} placeholder="Rechercher par N° facture, client ou commande..." />
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {['N° Facture', 'Client', 'Commande', 'Montant', 'Statut', 'Date', 'Échéance', 'Actions'].map(h => (
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
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-[12px] font-bold text-[var(--fg)]">{inv.id}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--fg)] flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[10px] text-[var(--fg-muted)] uppercase">{inv.client?.charAt(0)}</div>{inv.client}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-[11px] text-[var(--fg-subtle)]">{inv.orderId || '—'}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="font-bold text-[14px] text-[var(--fg)]">{formatCurrency(inv.amount)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isPaidStatus(inv.status) ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        inv.status === 'en retard' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className="text-[13px] text-[var(--fg-muted)] flex items-center gap-1.5"><Calendar size={12} /> {formatDate(inv.date)}</span></td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-[12px] font-semibold ${new Date(inv.dueDate) < new Date() && !isPaidStatus(inv.status) ? 'text-red-500' : 'text-[var(--fg-muted)]'}`}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => handleDownload(inv)} className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-[var(--fg)] bg-[var(--bg-subtle)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors" title="Télécharger PDF"><Download size={14} /> PDF</button>
                        {!isPaidStatus(inv.status) && (
                          <button onClick={() => handleMarkAsPaid(inv)} className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors" title="Marquer comme payée"><CheckCircle size={14} /> Payer</button>
                        )}
                        {isPaidStatus(inv.status) && (
                          <button onClick={() => setArchiveModal({ isOpen: true, invoice: inv })} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors" title="Archiver"><Archive size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <FileText size={28} className="text-[var(--border)] mb-2" />
                      <p className="font-medium text-[15px]">Aucune facture trouvée</p>
                      <p className="text-xs">Aucun résultat pour votre recherche.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Archive Modal ── */}
      <Modal isOpen={archiveModal.isOpen} onClose={() => setArchiveModal({ isOpen: false, invoice: null })} title="Archiver la facture" onConfirm={handleArchive} confirmText="Archiver" confirmVariant="primary">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10"><Archive size={22} className="text-indigo-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-2">Êtes-vous sûr d'archiver cette facture ?</p>
            {archiveModal.invoice && (
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-[var(--bg-subtle)] text-sm mb-3">
                <span className="font-mono font-bold text-[var(--fg)]">{archiveModal.invoice.id}</span>
                <span className="text-[var(--fg-muted)]">{archiveModal.invoice.client}</span>
                <span className="font-bold text-emerald-600">{formatCurrency(archiveModal.invoice.amount)}</span>
              </div>
            )}
            <p className="text-xs text-[var(--fg-muted)]">La facture sera déplacée vers les archives. Vous pourrez la restaurer pendant 7 jours.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
