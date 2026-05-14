import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Search, RotateCcw, AlertTriangle, CheckCircle, Calendar, Lock } from 'lucide-react'
import ArchiveService from '../../../services/ArchiveService'
import { extractApiErrorMessage, pickList } from '../../../utils/frontendApiAdapters'

const inputClass = 'form-input'

export default function ArchivePage({ showNotif }) {
  const [archiveLog, setArchiveLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', year: 'all' })
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ArchiveService.getAll()
      setArchiveLog(pickList(data, ['data']))
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur chargement archives')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredArchiveLog = useMemo(() => archiveLog.filter(e =>
    (!filters.search || (e.invoiceNumber || '').toLowerCase().includes(filters.search.toLowerCase()) || (e.customer || '').toLowerCase().includes(filters.search.toLowerCase())) &&
    (filters.year === 'all' || new Date(e.archivedAt).getFullYear().toString() === filters.year)
  ).sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt)), [archiveLog, filters])

  const availableYears = useMemo(() => [...new Set(archiveLog.map(e => new Date(e.archivedAt).getFullYear().toString()))].sort().reverse(), [archiveLog])

  const handleRestore = async (entry) => {
    const daysSince = Math.floor((new Date() - new Date(entry.archivedAt)) / (1000 * 60 * 60 * 24))
    if (daysSince > 7) return notify('error', `Restauration impossible (${daysSince} jours écoulés)`)
    try {
      await ArchiveService.restore(entry._id)
      setArchiveLog(prev => prev.filter(a => a._id !== entry._id))
      notify('success', `Facture ${entry.invoiceNumber} restaurée avec succès`)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur restauration archive')) }
  }

  const formatCurrency = a => (a || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }).replace('TND', 'DT')
  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-500/12 text-slate-500">
            <Archive size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Archive Comptable</h1>
            <p className="text-xs text-[var(--fg-muted)]">Consultez et restaurez les factures archivées</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)]">
        <div className="relative md:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
          <input type="text" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className={`${inputClass} pl-9`} placeholder="Rechercher par N° facture ou client..." />
        </div>
        <div>
          <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className={`${inputClass} cursor-pointer`}>
            <option value="all">Toutes les années</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border)]">
              <tr>
                {['Facture', 'Client', 'Montant', 'Motif', 'Date Archivage', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((__, j) => <td key={j} className="px-5 py-4"><div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" /></td>)}
                  </tr>
                ))
              ) : filteredArchiveLog.length > 0 ? (
                filteredArchiveLog.map(e => {
                  const daysSince = Math.floor((new Date() - new Date(e.archivedAt)) / (1000 * 60 * 60 * 24))
                  const canRestore = daysSince <= 7
                  return (
                    <tr key={e._id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap"><span className="font-mono text-[12px] font-bold text-[var(--fg)]">{e.invoiceNumber}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap"><span className="font-semibold text-[var(--fg)]">{e.customer || '—'}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap"><span className="font-bold text-[14px] text-[var(--fg)]">{formatCurrency(e.amount)}</span></td>
                      <td className="px-5 py-4"><span className="text-[13px] text-[var(--fg-muted)]">{e.reason || '—'}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap"><span className="text-[13px] text-[var(--fg-muted)] flex items-center gap-1.5"><Calendar size={12} /> {formatDate(e.archivedAt)}</span></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {canRestore ? (
                          <button onClick={() => handleRestore(e)} className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors" title="Restaurer"><RotateCcw size={14} /> Restaurer</button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--fg-subtle)]"><Lock size={12} /> Verrouillé ({daysSince}j)</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-[var(--fg-muted)]">
                      <Archive size={28} className="text-[var(--border)] mb-2" />
                      <p className="font-medium text-[15px]">Aucune archive</p>
                      <p className="text-xs">Aucun résultat trouvé pour votre recherche.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
