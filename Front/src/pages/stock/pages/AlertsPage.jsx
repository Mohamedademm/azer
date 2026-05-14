import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BellRing, CheckCircle, AlertTriangle, AlertOctagon, PackageX, Check } from 'lucide-react'
import productService from '../../../services/productService'
import notificationService from '../../../services/notificationService'
import { mapProductToUi, pickList } from '../../../utils/frontendApiAdapters'

export default function AlertsPage() {
  const [products, setProducts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll()
      const data = res.data || (Array.isArray(res) ? res : [])
      setNotifications(data.filter(n => n.type === 'stock_faible' || n.type === 'produit_epuise'))
    } catch (err) { console.error(err) }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const productRes = await productService.getAll({ limit: 500 })
      setProducts(pickList(productRes, ['products', 'data']).map(mapProductToUi))
      await fetchNotifications()
    } catch (error) { console.error('AlertsPage load error:', error) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleMarkAsRead = async (notifId) => {
    try {
      await notificationService.markAsRead(notifId)
      setNotifications(prev => prev.map(n => (n._id === notifId) ? { ...n, read: true } : n))
    } catch (err) { console.error(err) }
  }

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(unread.map(n => notificationService.markAsRead(n._id)))
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) { console.error(err) }
  }

  // Branch notification data with product data
  const alertsData = notifications.map(n => {
    const productDetail = products.find(p => String(p.id) === String(n.data?.productId))
    return { ...n, productName: productDetail ? productDetail.name : "Produit Inconnu", currentStock: n.data?.stock || 0 }
  })

  const lowStock = alertsData.filter(a => a.type === 'stock_faible')
  const outOfStock = alertsData.filter(a => a.type === 'produit_epuise')
  const unreadCount = alertsData.filter(a => !a.read).length

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/12 text-red-500">
            <BellRing size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Alertes de Stock</h1>
            <p className="text-xs text-[var(--fg-muted)]">Suivi en temps réel des ruptures et seuils critiques</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-all">
            <CheckCircle size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Section: Out of Stock */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-1">
              <PackageX size={16} className="text-red-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)]">Ruptures de stock ({outOfStock.length})</h2>
            </div>
            {outOfStock.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] text-center text-sm text-[var(--fg-muted)]">
                Aucun produit en rupture totale.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {outOfStock.map(n => (
                  <div key={n._id} className={`flex items-start justify-between p-4 rounded-xl border transition-all ${n.read ? 'bg-[var(--bg-subtle)] border-[var(--border)] opacity-70' : 'bg-red-500/5 border-red-500/20 shadow-sm'}`}>
                    <div className="flex gap-4">
                      <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-full ${n.read ? 'bg-[var(--bg-card)] text-[var(--fg-subtle)]' : 'bg-red-500/10 text-red-500'}`}>
                        <AlertOctagon size={16} />
                      </div>
                      <div>
                        <p className={`font-bold ${n.read ? 'text-[var(--fg-muted)]' : 'text-[var(--fg)]'}`}>{n.productName}</p>
                        <p className="text-xs text-[var(--fg-muted)] mt-1">Stock actuel : <strong className="text-red-500">{n.currentStock}</strong> unité(s)</p>
                        <p className="text-[10px] text-[var(--fg-subtle)] mt-1.5 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('fr-FR')} à {new Date(n.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    {!n.read && (
                      <button onClick={() => handleMarkAsRead(n._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="Marquer comme lu">
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Low Stock */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-1">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fg)]">Seuils critiques ({lowStock.length})</h2>
            </div>
            {lowStock.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] text-center text-sm text-[var(--fg-muted)]">
                Aucun produit sous le seuil d'alerte.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lowStock.map(n => (
                  <div key={n._id} className={`flex items-start justify-between p-4 rounded-xl border transition-all ${n.read ? 'bg-[var(--bg-subtle)] border-[var(--border)] opacity-70' : 'bg-amber-500/5 border-amber-500/20 shadow-sm'}`}>
                    <div className="flex gap-4">
                      <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-full ${n.read ? 'bg-[var(--bg-card)] text-[var(--fg-subtle)]' : 'bg-amber-500/10 text-amber-500'}`}>
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <p className={`font-bold ${n.read ? 'text-[var(--fg-muted)]' : 'text-[var(--fg)]'}`}>{n.productName}</p>
                        <p className="text-xs text-[var(--fg-muted)] mt-1">Stock actuel : <strong className="text-amber-500">{n.currentStock}</strong> unité(s) restantes.</p>
                        <p className="text-[10px] text-[var(--fg-subtle)] mt-1.5 font-mono">
                          {new Date(n.createdAt).toLocaleDateString('fr-FR')} à {new Date(n.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    {!n.read && (
                      <button onClick={() => handleMarkAsRead(n._id)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors" title="Marquer comme lu">
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}