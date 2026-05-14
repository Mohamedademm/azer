import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, Plus, Trash2, Calendar, Download, Eye, Zap, Printer, Shield, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import { reportService } from '../../../services/reportService'
import { accountService } from '../../../services/accountService'
import { transactionService } from '../../../services/transactionService'
import { depensesService } from '../../../services/depensesService'
import { getUserRole } from '../../../utils/auth'
import { extractApiErrorMessage, mapReportToUi, pickList } from '../../../utils/frontendApiAdapters'
import Modal from '../../../components/common/Modal'
import FormField from '../../../components/common/FormField'

const inputClass = 'form-input'
const selectClass = 'form-input cursor-pointer'
const today = new Date().toISOString().split('T')[0]

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Toutes les données' },
  { value: 'year', label: 'Cette année' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'month', label: 'Ce mois' },
  { value: 'custom', label: 'Période personnalisée' },
]

const formatCurrency = (n) => (n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }).replace('TND', 'DT')
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : ''
const formatDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

function getPeriodRange(period, customStart, customEnd) {
  const now = new Date()
  if (period === 'all') return { start: null, end: null }
  if (period === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0] }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return { start: new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0], end: new Date(now.getFullYear(), q * 3 + 3, 0).toISOString().split('T')[0] }
  }
  if (period === 'year') return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` }
  if (period === 'custom') return { start: customStart, end: customEnd }
  return { start: null, end: null }
}

function groupByCategory(items) {
  const map = {}
  items.forEach(item => {
    const cat = item.category || 'Sans catégorie'
    if (!map[cat]) map[cat] = { total: 0, count: 0 }
    map[cat].total += Number(item.amount) || 0
    map[cat].count++
  })
  return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
}

// ─── Print Component ────────────────────────────────────────────────────────
const FinancialReportContent = ({ data }) => {
  const { revenues, expenses, accounts, periodLabel, generatedAt } = data
  const totalRev = revenues.reduce((s, e) => s + e.amount, 0)
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0)
  const totalSoldes = accounts.reduce((s, a) => s + a.solde, 0)
  const net = totalRev - totalExp
  const revByCategory = groupByCategory(revenues)
  const expByCategory = groupByCategory(expenses)

  return (
    <div id="financial-report-content" className="p-6 bg-white text-slate-800 font-sans max-w-4xl mx-auto">
      <div className="bg-slate-900 text-white p-8 rounded-t-2xl flex justify-between items-start print:bg-slate-900 print:text-white">
        <div>
          <h1 className="text-3xl font-bold m-0 flex items-center gap-2"><FileText size={28} /> Rapport Financier</h1>
          <p className="mt-2 opacity-80 text-sm">Période : {periodLabel}</p>
        </div>
        <div className="text-right text-xs opacity-70">
          <p>Généré le</p>
          <p className="font-bold">{generatedAt}</p>
        </div>
      </div>

      <div className="border-x border-b border-slate-200 p-8 rounded-b-2xl">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { l: 'Total Revenus', v: formatCurrency(totalRev), c: 'text-emerald-600', bg: 'bg-emerald-50' },
            { l: 'Total Dépenses', v: formatCurrency(totalExp), c: 'text-red-600', bg: 'bg-red-50' },
            { l: 'Soldes Comptes', v: formatCurrency(totalSoldes), c: 'text-blue-600', bg: 'bg-blue-50' },
            { l: 'Résultat Net', v: formatCurrency(net), c: net >= 0 ? 'text-emerald-600' : 'text-red-600', bg: net >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          ].map((card, i) => (
            <div key={i} className={`p-4 rounded-xl text-center ${card.bg}`}>
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">{card.l}</div>
              <div className={`text-lg font-bold ${card.c}`}>{card.v}</div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 pb-1 mb-3">Revenus par catégorie</h3>
          {revByCategory.length === 0 ? <p className="text-sm text-slate-400 italic">Aucun revenu.</p> : revByCategory.map(([cat, { total, count }]) => (
            <div key={cat} className="py-2 border-b border-slate-100 last:border-0">
              <div className="flex justify-between text-sm mb-1">
                <span>{cat} <span className="text-slate-400 text-xs">({count})</span></span>
                <span className="font-semibold text-emerald-600">{formatCurrency(total)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${totalRev > 0 ? (total / totalRev) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold text-red-600 border-b-2 border-red-600 pb-1 mb-3">Dépenses par catégorie</h3>
          {expByCategory.length === 0 ? <p className="text-sm text-slate-400 italic">Aucune dépense.</p> : expByCategory.map(([cat, { total, count }]) => (
            <div key={cat} className="py-2 border-b border-slate-100 last:border-0">
              <div className="flex justify-between text-sm mb-1">
                <span>{cat} <span className="text-slate-400 text-xs">({count})</span></span>
                <span className="font-semibold text-red-600">{formatCurrency(total)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${totalExp > 0 ? (total / totalExp) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        {accounts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3">Soldes des comptes</h3>
            {accounts.map(a => (
              <div key={a.id} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span>🏦 {a.name}</span>
                <span className={`font-semibold ${a.solde >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(a.solde)}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`mt-8 p-6 rounded-xl flex justify-between items-center ${net >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <span className="font-bold text-slate-800">Résultat NET (Revenus - Dépenses)</span>
          <span className={`text-2xl font-bold ${net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(net)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage({ showNotif }) {
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({ search: '' })
  const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 })
  const [loading, setLoading] = useState(true)

  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewReport, setViewReport] = useState(null)

  // Generate Report
  const [showGenModal, setShowGenModal] = useState(false)
  const [genParams, setGenParams] = useState({ period: 'month', customStart: '', customEnd: today, title: '' })
  const [generating, setGenerating] = useState(false)
  
  // Preview
  const [previewData, setPreviewData] = useState(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const printRef = useRef(null)

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const userRole = getUserRole()
      const res = await reportService.getAll({ limit: 200 })
      const list = pickList(res, ['data'])
        .filter(r => userRole === 'admin_principal' || !r.tags?.length || r.tags.includes('source:finance'))
        .map(r => mapReportToUi(r))
      setReports(list)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Impossible de charger les rapports')) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const filteredData = useMemo(() => reports.filter(item => {
    if (filters.search) {
      const s = filters.search.toLowerCase()
      if (![item.title, item.description].some(f => f?.toLowerCase().includes(s))) return false
    }
    return true
  }), [reports, filters])

  const paginatedData = filteredData.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await reportService.delete(deleteTarget.backendId || deleteTarget.id)
      await loadData()
      notify('success', 'Rapport supprimé')
      setDeleteTarget(null)
    } catch (err) { notify('error', extractApiErrorMessage(err, 'Erreur de suppression')) }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { period, customStart, customEnd, title } = genParams
      const { start, end } = getPeriodRange(period, customStart, customEnd)

      const [transRes, expRes, accRes] = await Promise.all([
        transactionService.getAll({ limit: 5000 }),
        depensesService?.getAll({ limit: 5000 }).catch(() => ({ data: [] })),
        accountService.getAll({ limit: 100 })
      ])

      const dateFilter = (d) => {
        const dateStr = new Date(d).toISOString().split('T')[0]
        return dateStr >= (start || '1970-01-01') && dateStr <= (end || today)
      }

      const revenues = (transRes.data || [])
        .filter(t => dateFilter(t.date) && Number(t.totalCredit) > 0)
        .map(t => ({ id: t._id, date: t.date, description: t.description, amount: Number(t.totalCredit), category: t.category || 'Vente', isExpense: false }))

      const expenses = (expRes.data || [])
        .filter(e => dateFilter(e.date))
        .map(e => ({ id: e._id, date: e.date, description: e.description, amount: Number(e.amount || e.totalDebit), category: e.category || 'Charges', isExpense: true }))

      setPreviewData({
        revenues, expenses,
        accounts: (accRes.data || []).map(a => ({ id: a._id, name: a.name, solde: Number(a.balance) || 0 })),
        periodLabel: PERIOD_OPTIONS.find(p => p.value === period)?.label || period,
        generatedAt: new Date().toLocaleString('fr-FR')
      })
      setPreviewTitle(title || `Rapport Financier - ${formatDate(new Date())}`)
      setShowGenModal(false)
    } catch (err) { notify('error', 'Erreur lors de la génération des données') }
    finally { setGenerating(false) }
  }

  const handleSaveReport = async () => {
    if (!previewData) return
    setSaving(true)
    try {
      const totalRev = previewData.revenues.reduce((s, e) => s + e.amount, 0)
      const totalExp = previewData.expenses.reduce((s, e) => s + e.amount, 0)
      const totalSoldes = previewData.accounts.reduce((s, a) => s + a.solde, 0)
      const net = totalRev - totalExp + totalSoldes

      await reportService.create({
        title: previewTitle,
        description: `NET: ${formatCurrency(net)} | Période: ${previewData.periodLabel}`,
        type: 'financier',
        date: new Date().toISOString(),
        data: { summary: { totalRevenues: totalRev, totalExpenses: totalExp, totalAccounts: totalSoldes, net, periodLabel: previewData.periodLabel }, details: { revenues: previewData.revenues, expenses: previewData.expenses, accounts: previewData.accounts } },
        tags: ['source:finance', 'auto-generated']
      })
      await loadData()
      setPreviewData(null)
      notify('success', 'Rapport sauvegardé avec succès')
    } catch (err) { notify('error', 'Erreur de sauvegarde') }
    finally { setSaving(false) }
  }

  const handlePrint = () => {
    const content = document.getElementById('financial-report-content')
    if (!content) return
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    printWindow.document.write(`<html><head><title>${previewTitle || 'Rapport'}</title><script src="https://cdn.tailwindcss.com"></script></head><body>${content.outerHTML}</body></html>`)
    printWindow.document.close()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 1000)
  }

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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Rapports & Synthèses</h1>
            <p className="text-xs text-[var(--fg-muted)]">Générez et consultez vos bilans financiers</p>
          </div>
        </div>
        <button onClick={() => setShowGenModal(true)} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px">
          <Zap size={16} /> Générer un rapport
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
        <input type="text" value={filters.search} onChange={e => setFilters({ search: e.target.value })} className={`${inputClass} pl-9`} placeholder="Rechercher un rapport..." />
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />)}
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedData.map(r => (
            <div key={r.id} className="group relative flex flex-col p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${r.tags?.includes('auto-generated') ? 'bg-indigo-500/10 text-indigo-500' : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)]'}`}>
                    {r.tags?.includes('auto-generated') ? <Zap size={18} /> : <FileText size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--fg)] text-sm line-clamp-1" title={r.title}>{r.title || 'Rapport sans titre'}</h3>
                    <p className="text-[11px] font-medium text-[var(--fg-muted)]">{formatDate(r.date)}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--fg-subtle)] line-clamp-2 flex-1 mb-4">{r.description || 'Aucune description disponible.'}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--fg-subtle)]">Créé le {formatDateTime(r.createdAt)}</span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setViewReport(r)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-colors" title="Consulter"><Eye size={14} /></button>
                  <button onClick={() => setDeleteTarget(r)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors" title="Supprimer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--fg-muted)]">
          <FileText size={40} className="text-[var(--border)] mb-4" />
          <p className="font-medium text-lg">Aucun rapport trouvé</p>
          <p className="text-sm">Générez votre premier rapport financier pour analyser vos données.</p>
        </div>
      )}

      {/* ── Generate Modal ── */}
      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Générer un rapport financier" onConfirm={handleGenerate} confirmText="Générer les données" size="md">
        <div className="flex flex-col gap-4">
          <FormField label="Titre du rapport" id="gen-title">
            <input type="text" value={genParams.title} onChange={e => setGenParams(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Rapport financier..." autoFocus />
          </FormField>
          <FormField label="Période" id="gen-period">
            <select value={genParams.period} onChange={e => setGenParams(p => ({ ...p, period: e.target.value }))} className={selectClass}>
              {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          {genParams.period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date de début" id="gen-start"><input type="date" value={genParams.customStart} onChange={e => setGenParams(p => ({ ...p, customStart: e.target.value }))} className={inputClass} max={genParams.customEnd} /></FormField>
              <FormField label="Date de fin" id="gen-end"><input type="date" value={genParams.customEnd} onChange={e => setGenParams(p => ({ ...p, customEnd: e.target.value }))} className={inputClass} min={genParams.customStart} max={today} /></FormField>
            </div>
          )}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs mt-2 flex gap-3">
            <Shield size={16} className="shrink-0" />
            <p>Le rapport regroupera toutes vos transactions, dépenses et soldes actuels selon la période sélectionnée.</p>
          </div>
        </div>
      </Modal>

      {/* ── Preview Modal ── */}
      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-bold text-lg text-[var(--fg)] flex items-center gap-2"><Eye size={18} className="text-indigo-500" /> Aperçu du rapport généré</h3>
              <button onClick={() => setPreviewData(null)} className="p-2 -mr-2 rounded-lg text-[var(--fg-subtle)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-8" ref={printRef}>
              <FinancialReportContent data={previewData} />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
              <button onClick={() => setPreviewData(null)} className="h-9 px-4 rounded-lg text-sm font-semibold text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors">Annuler</button>
              <button onClick={handlePrint} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"><Printer size={16} /> Imprimer / PDF</button>
              <button onClick={handleSaveReport} disabled={saving} className="flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                Enregistrer le rapport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Saved Report Modal ── */}
      {viewReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-bold text-lg text-[var(--fg)] flex items-center gap-2"><FileText size={18} className="text-indigo-500" /> {viewReport.title}</h3>
              <button onClick={() => setViewReport(null)} className="p-2 -mr-2 rounded-lg text-[var(--fg-subtle)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed mb-4">{viewReport.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--fg-subtle)]">
                    <span className="px-2 py-1 bg-[var(--bg-subtle)] rounded">Date : {formatDate(viewReport.date)}</span>
                    <span className="px-2 py-1 bg-[var(--bg-subtle)] rounded">Créé le : {formatDateTime(viewReport.createdAt)}</span>
                  </div>
                </div>

                {viewReport.data?.summary && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 mb-1">Revenus</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(viewReport.data.summary.totalRevenues)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-600/70 mb-1">Dépenses</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(viewReport.data.summary.totalExpenses)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70 mb-1">NET</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(viewReport.data.summary.net)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le rapport" onConfirm={handleDelete} confirmText="Supprimer" confirmVariant="danger" size="sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10"><AlertTriangle size={22} className="text-red-500" /></div>
          <div>
            <p className="font-semibold text-[var(--fg)] mb-1">Confirmer la suppression ?</p>
            <p className="text-sm text-[var(--fg-muted)]">Le rapport sera définitivement supprimé de votre historique.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}