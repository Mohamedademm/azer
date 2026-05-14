import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Save, CheckCircle, XCircle, Shield, CreditCard, User, EyeOff, Eye } from 'lucide-react'
import userService from '../../../services/userService'
import { depensesService } from '../../../services/depensesService'
import { extractApiErrorMessage } from '../../../utils/frontendApiAdapters'

const INITIAL_SETTINGS = {
  firstName: '', lastName: '', email: '', phone: '', department: '', role: '',
  currentPassword: '', newPassword: '', confirmPassword: ''
}

export default function SettingsPage({ showNotif }) {
  const [userSettings, setUserSettings] = useState({ ...INITIAL_SETTINGS })
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [updatingLimit, setUpdatingLimit] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })

  const [limitSettings, setLimitSettings] = useState({
    enabled: false, maxMonthlyAmount: '', warningThresholdPercent: 80,
    currentMonthTotal: 0, percent: 0, month: '',
  })

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 4000)
    if (showNotif) showNotif(text, type)
  }

  const loadProfile = async () => {
    try {
      const [profileRes, limitsRes] = await Promise.all([
        userService.getProfile().catch(() => null),
        depensesService.getSettings().catch(() => null)
      ])
      
      const profile = profileRes?.data || profileRes || {}
      setUserSettings(prev => ({
        ...prev,
        firstName: profile.firstName || 'Gestionnaire',
        lastName: profile.lastName || 'Finance',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || 'Finance',
        role: profile.role || 'admin_finance',
        currentPassword: '', newPassword: '', confirmPassword: '',
      }))

      const limits = limitsRes?.data || limitsRes || {}
      setLimitSettings({
        enabled: Boolean(limits.enabled),
        maxMonthlyAmount: limits.maxMonthlyAmount || '',
        warningThresholdPercent: limits.warningThresholdPercent || 80,
        currentMonthTotal: limits.currentMonthTotal || 0,
        percent: limits.percent || 0,
        month: limits.month || '',
      })
    } catch (error) {
      notify('error', extractApiErrorMessage(error, 'Impossible de charger le profil'))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [])

  const handleChange = (e) => setUserSettings({ ...userSettings, [e.target.name]: e.target.value })
  
  const handleLimitChange = (e) => {
    const { name, type, checked, value } = e.target
    setLimitSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSaveLimitSettings = async () => {
    const maxMonthlyAmount = Number(limitSettings.maxMonthlyAmount) || 0
    const warningThresholdPercent = Number(limitSettings.warningThresholdPercent) || 80

    if (limitSettings.enabled && maxMonthlyAmount <= 0) return notify('error', 'La limite mensuelle doit être supérieure à 0')
    if (warningThresholdPercent < 1 || warningThresholdPercent > 100) return notify('error', 'Le seuil doit être entre 1 et 100%')

    setUpdatingLimit(true)
    try {
      const response = await depensesService.updateSettings({ enabled: Boolean(limitSettings.enabled), maxMonthlyAmount, warningThresholdPercent })
      const saved = response?.data || response
      setLimitSettings(prev => ({ ...prev, ...saved, maxMonthlyAmount: saved.maxMonthlyAmount || '', warningThresholdPercent: saved.warningThresholdPercent || warningThresholdPercent }))
      notify('success', 'Limite des dépenses mise à jour')
    } catch (error) { notify('error', extractApiErrorMessage(error, 'Erreur de mise à jour de la limite')) }
    finally { setUpdatingLimit(false) }
  }

  const handleSaveSettings = async () => {
    if (!userSettings.firstName || !userSettings.lastName || !userSettings.email) return notify('error', 'Champs obligatoires manquants')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userSettings.email)) return notify('error', "Format d'email invalide")
    
    const changingPassword = userSettings.newPassword || userSettings.confirmPassword || userSettings.currentPassword
    if (changingPassword) {
      if (!userSettings.currentPassword) return notify('error', 'Entrez votre mot de passe actuel')
      if (userSettings.newPassword !== userSettings.confirmPassword) return notify('error', 'Les nouveaux mots de passe ne correspondent pas')
      if (userSettings.newPassword.length < 6) return notify('error', 'Minimum 6 caractères pour le mot de passe')
    }

    setUpdatingProfile(true)
    try {
      await userService.updateProfile({ firstName: userSettings.firstName, lastName: userSettings.lastName, email: userSettings.email, phone: userSettings.phone, department: userSettings.department })
      if (changingPassword) await userService.changePassword(userSettings.currentPassword, userSettings.newPassword)
      await loadProfile()
      notify('success', 'Profil mis à jour avec succès')
    } catch (error) { notify('error', extractApiErrorMessage(error, 'Erreur de mise à jour du profil')) }
    finally { setUpdatingProfile(false) }
  }

  const inputClass = "w-full h-10 px-3 rounded-lg text-sm bg-[var(--bg-card)] border border-[var(--border)] text-[var(--fg)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all"
  const labelClass = "text-[12.5px] font-semibold text-[var(--fg-muted)] mb-1.5 block"

  if (loading) return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="h-10 w-48 bg-[var(--bg-card)] rounded-lg animate-pulse" />
      <div className="h-96 w-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] animate-pulse" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toastMsg.text && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-[var(--shadow-lg)] text-sm font-semibold border ${toastMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'}`}>
            {toastMsg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Paramètres Finance</h1>
          <p className="text-xs text-[var(--fg-muted)]">Gérez votre profil et les limites de dépenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Main Settings Column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Profile Section */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <User size={16} className="text-[var(--fg-subtle)]" />
              <h2 className="font-bold text-[var(--fg)]">Informations Personnelles</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className={labelClass}>Prénom</label><input type="text" name="firstName" value={userSettings.firstName} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Nom</label><input type="text" name="lastName" value={userSettings.lastName} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Email</label><input type="email" name="email" value={userSettings.email} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Téléphone</label><input type="tel" name="phone" value={userSettings.phone} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Département</label><input type="text" name="department" value={userSettings.department} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Rôle système</label><input type="text" value={userSettings.role} disabled className={`${inputClass} bg-[var(--bg-subtle)] text-[var(--fg-muted)] cursor-not-allowed`} /></div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <Shield size={16} className="text-[var(--fg-subtle)]" />
              <h2 className="font-bold text-[var(--fg)]">Sécurité & Mot de passe</h2>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <p className="text-xs text-[var(--fg-muted)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border)]">
                Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe.
              </p>
              
              <div>
                <label className={labelClass}>Mot de passe actuel</label>
                <div className="relative">
                  <input type={showPwd.current ? 'text' : 'password'} name="currentPassword" value={userSettings.currentPassword} onChange={handleChange} className={inputClass} placeholder="Requis pour changer de mot de passe" />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">{showPwd.current ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Nouveau mot de passe</label>
                  <div className="relative">
                    <input type={showPwd.new ? 'text' : 'password'} name="newPassword" value={userSettings.newPassword} onChange={handleChange} className={inputClass} placeholder="Minimum 6 caractères" />
                    <button type="button" onClick={() => setShowPwd(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">{showPwd.new ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirmer</label>
                  <div className="relative">
                    <input type={showPwd.confirm ? 'text' : 'password'} name="confirmPassword" value={userSettings.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Minimum 6 caractères" />
                    <button type="button" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">{showPwd.confirm ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-[var(--bg-subtle)] border-t border-[var(--border)] flex justify-end">
              <button onClick={handleSaveSettings} disabled={updatingProfile} className="flex items-center gap-2 h-9 px-6 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {updatingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                Enregistrer le profil
              </button>
            </div>
          </div>
        </div>

        {/* ── Finance Specific Limits Column ── */}
        <div className="flex flex-col gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-500" />
              <h2 className="font-bold text-[var(--fg)]">Limites de Dépenses</h2>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--fg)]">Activer le plafond</span>
                  <span className="text-xs text-[var(--fg-muted)]">Bloquer les dépenses excessives</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="enabled" checked={limitSettings.enabled} onChange={handleLimitChange} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 dark:bg-slate-700"></div>
                </label>
              </div>

              <div>
                <label className={labelClass}>Plafond mensuel (TND)</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" name="maxMonthlyAmount" value={limitSettings.maxMonthlyAmount} onChange={handleLimitChange} className={`${inputClass} pl-8 font-mono`} disabled={!limitSettings.enabled} />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] font-bold">DT</span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Alerte à partir de (%)</label>
                <div className="relative">
                  <input type="number" min="1" max="100" name="warningThresholdPercent" value={limitSettings.warningThresholdPercent} onChange={handleLimitChange} className={`${inputClass} pr-8`} disabled={!limitSettings.enabled} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]">%</span>
                </div>
              </div>

              <div className="mt-2 pt-5 border-t border-[var(--border)]">
                <label className={labelClass}>Consommation du mois</label>
                <div className="w-full bg-[var(--bg-subtle)] rounded-full h-2.5 mb-2 overflow-hidden border border-[var(--border)]">
                  <div className={`h-2.5 rounded-full ${limitSettings.percent >= 90 ? 'bg-red-500' : limitSettings.percent >= limitSettings.warningThresholdPercent ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(limitSettings.percent, 100)}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[var(--fg)]">{Number(limitSettings.currentMonthTotal).toFixed(2)} DT</span>
                  <span className="text-[var(--fg-muted)]">{Number(limitSettings.maxMonthlyAmount).toFixed(2)} DT</span>
                </div>
                <div className="text-right mt-1 text-[10px] text-[var(--fg-subtle)] font-mono">{Number(limitSettings.percent).toFixed(1)}% consommé</div>
              </div>

              <button onClick={handleSaveLimitSettings} disabled={updatingLimit} className="w-full mt-2 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {updatingLimit ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={16} />}
                Enregistrer la limite
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
