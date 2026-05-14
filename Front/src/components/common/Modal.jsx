import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Modal — Premium design system modal
 * Props: isOpen, onClose, title, children, onConfirm, confirmText,
 *        showConfirm, confirmVariant ('primary'|'danger'|'success'), size ('sm'|'md'|'lg')
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirmer',
  showConfirm = true,
  confirmVariant = 'primary',
  loading = false,
  size = 'md',
}) {
  const overlayRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  const confirmBtnClass = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20',
    danger:  'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-500/20',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20',
  }[confirmVariant] || 'bg-indigo-600 hover:bg-indigo-700 text-white'

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className={cn(
          'modal-panel w-full',
          sizes[size] || sizes.md
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3 id="modal-title" className="text-base font-semibold text-[var(--fg)]">{title}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)] transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-all"
          >
            Annuler
          </button>
          {showConfirm && (
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'flex items-center justify-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                confirmBtnClass
              )}
            >
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
