import { useCallback, useEffect, useMemo, useState } from 'react'
import { invoiceService } from '../../../services/invoiceService'
import ArchiveService from '../../../services/ArchiveService'
import {
  extractApiErrorMessage,
  mapInvoiceToUi,
  pickList,
} from '../../../utils/frontendApiAdapters'

const C = {
  STATUS: {
    payee: '#10b981',
    'payee-ui': '#10b981',
    'en attente': '#f59e0b',
    envoyee: '#3b82f6',
    brouillon: '#6b7280',
    'en retard': '#ef4444',
    archivee: '#6b7280',
  },
  STATUS_BG: {
    payee: '#d1fae5',
    'payee-ui': '#d1fae5',
    'en attente': '#fef3c7',
    envoyee: '#dbeafe',
    brouillon: '#f3f4f6',
    'en retard': '#fee2e2',
    archivee: '#e5e7eb',
  },
}

const normaliseStatusKey = (status = '') =>
  String(status).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const isPaidStatus = (status = '') => {
  const raw = String(status).toLowerCase()
  const key = normaliseStatusKey(status)
  return raw.startsWith('pay') || key.startsWith('pay')
}

const utils = {
  formatCurrency: (amount) =>
    (amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
  formatDate: (date) => (date ? new Date(date).toLocaleDateString('fr-FR') : ''),
}

const StatusBadge = ({ status }) => {
  const key = normaliseStatusKey(status)
  return (
    <span
      className="status-badge"
      style={{
        background: C.STATUS_BG[key] || '#f3f4f6',
        color: C.STATUS[key] || '#6b7280',
      }}
    >
      {status}
    </span>
  )
}

const useNotification = () => {
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000)
  }, [])

  return { notification, showNotification }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [archiveModal, setArchiveModal] = useState({ show: false, invoice: null })
  const { notification, showNotification } = useNotification()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await invoiceService.getAll({ limit: 200 })
      setInvoices(pickList(res, ['data']).map(mapInvoiceToUi))
    } catch (err) {
      showNotification(extractApiErrorMessage(err, 'Impossible de charger les factures'), 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => { loadData() }, [loadData])

  const filteredInvoices = useMemo(() =>
    invoices
      .filter((invoice) => {
        if (!search) return true
        const term = search.toLowerCase()
        return (
          invoice.id.toLowerCase().includes(term) ||
          invoice.client.toLowerCase().includes(term) ||
          (invoice.orderId || '').toLowerCase().includes(term)
        )
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [invoices, search]
  )

  const handleMarkAsPaid = async (invoice) => {
    try {
      await invoiceService.markAsPaid(invoice.backendId || invoice.id, {
        paymentMethod: 'virement',
        amount: Number(invoice.amount) || 0,
        reference: `UI-${invoice.id}`,
      })
      await loadData()
      showNotification('Facture marquee payee', 'success')
    } catch (err) {
      showNotification(extractApiErrorMessage(err, 'Impossible de marquer la facture comme payee'), 'error')
    }
  }

  const handleArchive = async (invoice, reason = 'Archivage manuel') => {
    try {
      await ArchiveService.archive(invoice.backendId || invoice.id, reason)
      await loadData()
      showNotification(`Facture ${invoice.id} archivee`, 'success')
    } catch (err) {
      showNotification(extractApiErrorMessage(err, 'Impossible d archiver la facture'), 'error')
    }
  }

  const handleDownload = async (invoice) => {
    try {
      await invoiceService.downloadPdf(invoice.backendId || invoice.id)
      showNotification('Facture telechargee', 'success')
    } catch (err) {
      showNotification(extractApiErrorMessage(err, 'Impossible de telecharger la facture'), 'error')
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
  }

  return (
    <div className="invoices-content">
      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      <div className="content-header">
        <div className="header-left">
          <h2>Factures</h2>
          <span className="header-count">{filteredInvoices.length}</span>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box large">
          <span className="search-icon">Rech.</span>
          <input
            type="text"
            placeholder="Rechercher par numero facture, client ou commande..."
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>N.</th>
              <th>Date</th>
              <th>Commande</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Echeance</th>
              <th>Archive</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="invoice-number">{invoice.id}</td>
                <td>{utils.formatDate(invoice.date)}</td>
                <td className="order-id">{invoice.orderId}</td>
                <td className="client-name">{invoice.client}</td>
                <td className="amount">{utils.formatCurrency(invoice.amount)}</td>
                <td><StatusBadge status={invoice.status} /></td>
                <td className={new Date(invoice.dueDate) < new Date() && !isPaidStatus(invoice.status) ? 'text-danger' : ''}>
                  {utils.formatDate(invoice.dueDate)}
                </td>
                <td>
                  {isPaidStatus(invoice.status) && (
                    <button
                      className="btn-small btn-archive"
                      onClick={() => setArchiveModal({ show: true, invoice })}
                      title="Archiver"
                    >
                      Archiver
                    </button>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {!isPaidStatus(invoice.status) && (
                      <button
                        className="action-btn success"
                        onClick={() => handleMarkAsPaid(invoice)}
                        title="Marquer payee"
                      >
                        Payer
                      </button>
                    )}
                    <button
                      className="action-btn"
                      title="Telecharger"
                      onClick={() => handleDownload(invoice)}
                    >
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  Aucune facture
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {archiveModal.show && archiveModal.invoice && (
        <div className="modal-overlay" onClick={() => setArchiveModal({ show: false, invoice: null })}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Archiver la facture</h3>
              <button className="modal-close" onClick={() => setArchiveModal({ show: false, invoice: null })}>x</button>
            </div>
            <div className="modal-body">
              <p>Vous etes sur le point d'archiver :</p>
              <div className="archive-invoice-info">
                <p><strong>Facture:</strong> {archiveModal.invoice.id}</p>
                <p><strong>Client:</strong> {archiveModal.invoice.client}</p>
                <p><strong>Montant:</strong> {utils.formatCurrency(archiveModal.invoice.amount)}</p>
                <p><strong>Date:</strong> {utils.formatDate(archiveModal.invoice.date)}</p>
              </div>
              <p className="archive-warning">Vous pourrez restaurer cette facture pendant 7 jours depuis la page Archive.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setArchiveModal({ show: false, invoice: null })}>Annuler</button>
              <button
                className="btn-primary"
                onClick={() => {
                  handleArchive(archiveModal.invoice, 'Archivage manuel')
                  setArchiveModal({ show: false, invoice: null })
                }}
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
