import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Building2, Shield, Lock, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import userService from '../../../services/userService'
import { getUserEmail, getUserRole } from '../../../utils/auth'
import { extractApiErrorMessage } from '../../../utils/frontendApiAdapters'

const inputClass = "w-full h-10 px-3 py-2 bg-[var(--bg-card)] text-[var(--fg)] text-sm border border-[var(--border)] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--fg-subtle)]"

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', role: '', currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fallbackRole = getUserRole() || 'admin_facture'
    const fallbackEmail = getUserEmail() || ''

    userService.getProfile().then(res => {
      if (!active) return
      const p = res?.data || res
      setUserSettings(u => ({
        ...u,
        firstName: p?.firstName || (fallbackRole === 'admin_principal' ? 'Admin' : 'Gestionnaire'),
        lastName: p?.lastName || (fallbackRole === 'admin_principal' ? 'Principal' : 'Facturation'),
        email: p?.email || fallbackEmail,
        phone: p?.phone || '',
        department: p?.department || 'Comptabilité',
        role: p?.role || fallbackRole,
      }))
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setUserSettings(u => ({ ...u, email: fallbackEmail, role: fallbackRole }))
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserSettings(u => ({ ...u, [name]: value }))
  }

  const handleSave = async () => {
    if (!userSettings.firstName || !userSettings.lastName || !userSettings.email) {
      return setMessage({ type: 'error', text: 'Prénom, nom et email sont requis' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userSettings.email)) {
      return setMessage({ type: 'error', text: "Format d'email invalide" })
    }
    if (userSettings.newPassword || userSettings.confirmPassword || userSettings.currentPassword) {
      if (!userSettings.currentPassword) return setMessage({ type: 'error', text: 'Mot de passe actuel requis' })
      if (userSettings.newPassword !== userSettings.confirmPassword) return setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' })
      if (userSettings.newPassword.length < 6) return setMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    setUpdating(true)
    setMessage({ type: '', text: '' })

    try {
      await userService.updateProfile({
        firstName: userSettings.firstName,
        lastName: userSettings.lastName,
        email: userSettings.email,
        phone: userSettings.phone,
        department: userSettings.department,
      })
      if (userSettings.newPassword) {
        await userService.changePassword(userSettings.currentPassword, userSettings.newPassword)
      }
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
      setUserSettings(u => ({ ...u, currentPassword: '', newPassword: '', confirmPassword: '' }))
      setTimeout(() => setMessage({ type: '', text: '' }), 4000)
    } catch (err) {
      setMessage({ type: 'error', text: extractApiErrorMessage(err, 'Impossible de mettre à jour le profil') })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]" />
      <div className="h-64 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]" />
      <div className="h-40 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Paramètres du profil</h1>
          <p className="text-xs text-[var(--fg-muted)]">Gérez vos informations personnelles et vos préférences</p>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 p-4 rounded-xl border font-medium text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6">
        {/* Informations personnelles */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-bold text-[var(--fg)] uppercase tracking-wider mb-5 flex items-center gap-2">
            <User size={16} className="text-indigo-500" /> Informations personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Prénom</label>
              <input type="text" name="firstName" value={userSettings.firstName} onChange={handleChange} className={inputClass} placeholder="Votre prénom" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Nom</label>
              <input type="text" name="lastName" value={userSettings.lastName} onChange={handleChange} className={inputClass} placeholder="Votre nom" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)] flex items-center gap-1"><Mail size={12} /> Email</label>
              <input type="email" name="email" value={userSettings.email} onChange={handleChange} className={inputClass} placeholder="votre@email.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)] flex items-center gap-1"><Phone size={12} /> Téléphone</label>
              <input type="tel" name="phone" value={userSettings.phone} onChange={handleChange} className={inputClass} placeholder="+216 ..." />
            </div>
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-bold text-[var(--fg)] uppercase tracking-wider mb-5 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-500" /> Informations professionnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Département</label>
              <input type="text" name="department" value={userSettings.department} onChange={handleChange} className={inputClass} placeholder="Votre département" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)] flex items-center gap-1"><Shield size={12} /> Rôle (Lecture seule)</label>
              <input type="text" value={userSettings.role} disabled className={`${inputClass} bg-[var(--bg-subtle)] opacity-70 cursor-not-allowed`} />
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-[var(--fg)] uppercase tracking-wider flex items-center gap-2">
              <Lock size={16} className="text-indigo-500" /> Sécurité
            </h2>
            <span className="text-xs text-[var(--fg-subtle)]">Laissez vide pour conserver le mot de passe actuel</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Mot de passe actuel</label>
              <input type="password" name="currentPassword" value={userSettings.currentPassword} onChange={handleChange} className={inputClass} placeholder="Requis si vous souhaitez changer le mot de passe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Nouveau mot de passe</label>
              <input type="password" name="newPassword" value={userSettings.newPassword} onChange={handleChange} className={inputClass} placeholder="Minimum 6 caractères" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-[var(--fg-muted)]">Confirmer le mot de passe</label>
              <input type="password" name="confirmPassword" value={userSettings.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Répétez le nouveau mot de passe" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={updating} className="flex items-center gap-2 h-10 px-8 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all disabled:opacity-50 hover:-translate-y-px">
            {updating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
