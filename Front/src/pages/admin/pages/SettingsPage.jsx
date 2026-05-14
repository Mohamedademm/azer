// src/pages/admin/pages/SettingsPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Save, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff, Settings } from 'lucide-react'
import AccountSettings from '../../../components/forms/AccountSettings'
import userService from '../../../services/userService'
import { getUserRole } from '../../../utils/auth'
import { extractApiErrorMessage } from '../../../utils/frontendApiAdapters'

export default function SettingsPage() {
  const navigate = useNavigate()

  const [userSettings, setUserSettings] = useState({
    firstName: '', lastName: '', email: '', phone: '', department: '', role: '',
    currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' })
  const [settingsErrors, setSettingsErrors]   = useState({})
  const [updating, setUpdating]               = useState(false)
  const [showCurrentPwd, setShowCurrentPwd]   = useState(false)
  const [showNewPwd, setShowNewPwd]           = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const response = await userService.getProfile()
        const profile = response?.data || response
        if (!active) return
        setUserSettings(prev => ({
          ...prev,
          firstName:  profile?.firstName  || 'Admin',
          lastName:   profile?.lastName   || 'Principal',
          email:      profile?.email      || '',
          phone:      profile?.phone      || '',
          department: profile?.department || 'Direction',
          role:       profile?.role       || getUserRole() || 'admin_principal',
          currentPassword: '', newPassword: '', confirmPassword: '',
        }))
      } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserSettings(prev => ({ ...prev, [name]: value }))
    setSettingsErrors(prev => {
      const next = { ...prev }
      delete next[name]
      if (['currentPassword', 'newPassword', 'confirmPassword'].includes(name)) {
        delete next.currentPassword; delete next.newPassword; delete next.confirmPassword
      }
      return next
    })
    if (settingsMessage.type === 'error') setSettingsMessage({ type: '', text: '' })
  }

  const handleSave = async () => {
    const errors = {}
    if (!userSettings.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!userSettings.lastName.trim())  errors.lastName  = 'Le nom est requis'
    if (!userSettings.email.trim())     errors.email     = "L'email est requis"
    if (userSettings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userSettings.email)) {
      errors.email = "Format d'email invalide"
    }
    const changingPwd = userSettings.newPassword || userSettings.confirmPassword || userSettings.currentPassword
    if (changingPwd) {
      if (!userSettings.currentPassword) errors.currentPassword = 'Mot de passe actuel requis'
      if (!userSettings.newPassword)     errors.newPassword = 'Nouveau mot de passe requis'
      else if (userSettings.newPassword.length < 6) errors.newPassword = 'Minimum 6 caractères'
      if (userSettings.newPassword !== userSettings.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    setSettingsErrors(errors)
    if (Object.keys(errors).length) {
      setSettingsMessage({ type: 'error', text: 'Veuillez corriger les champs indiqués.' })
      return
    }
    setUpdating(true)
    setSettingsMessage({ type: 'info', text: 'Mise à jour en cours...' })
    try {
      await userService.updateProfile({
        firstName: userSettings.firstName.trim(),
        lastName:  userSettings.lastName.trim(),
        email:     userSettings.email.trim(),
        phone:     userSettings.phone,
        department: userSettings.department,
      })
      if (userSettings.newPassword) {
        await userService.changePassword(userSettings.currentPassword, userSettings.newPassword)
      }
      setSettingsErrors({})
      setSettingsMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
      setUserSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (e) {
      setSettingsMessage({ type: 'error', text: extractApiErrorMessage(e, 'Impossible de mettre à jour le profil') })
    } finally {
      setUpdating(false)
    }
  }

  const inputClass = (field) => [
    'form-input',
    settingsErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
  ].join(' ')

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Paramètres du profil</h1>
          <p className="text-xs text-[var(--fg-muted)]">Gérez vos informations personnelles et votre sécurité</p>
        </div>
      </div>

      {/* ── Toast Message ── */}
      <AnimatePresence>
        {settingsMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
              settingsMessage.type === 'success' ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              settingsMessage.type === 'error'   ? 'bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400' :
              'bg-indigo-500/8 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {settingsMessage.type === 'success' && <CheckCircle size={16} />}
            {settingsMessage.type === 'error' && <XCircle size={16} />}
            {settingsMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile Info Card ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
          <User size={16} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-[var(--fg)]">Informations personnelles</h2>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Prénom <span className="text-red-500">*</span></label>
            <input name="firstName" value={userSettings.firstName} onChange={handleChange}
              className={inputClass('firstName')} placeholder="Prénom" />
            {settingsErrors.firstName && <p className="text-[11.5px] text-red-500">{settingsErrors.firstName}</p>}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Nom <span className="text-red-500">*</span></label>
            <input name="lastName" value={userSettings.lastName} onChange={handleChange}
              className={inputClass('lastName')} placeholder="Nom de famille" />
            {settingsErrors.lastName && <p className="text-[11.5px] text-red-500">{settingsErrors.lastName}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Email <span className="text-red-500">*</span></label>
            <input name="email" type="email" value={userSettings.email} onChange={handleChange}
              className={inputClass('email')} placeholder="email@example.com" />
            {settingsErrors.email && <p className="text-[11.5px] text-red-500">{settingsErrors.email}</p>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Téléphone</label>
            <input name="phone" type="tel" value={userSettings.phone} onChange={handleChange}
              className="form-input" placeholder="+213 xxx xxx xxx" />
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Département</label>
            <input name="department" value={userSettings.department} onChange={handleChange}
              className="form-input" placeholder="Direction, Finance..." />
          </div>

          {/* Role (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Rôle</label>
            <input value={userSettings.role} readOnly
              className="form-input opacity-60 cursor-not-allowed bg-[var(--bg-subtle)]" />
          </div>
        </div>
      </div>

      {/* ── Password Card ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
          <Lock size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-[var(--fg)]">Changer le mot de passe</h2>
          <span className="text-[11px] text-[var(--fg-subtle)] ml-1">(optionnel)</span>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Mot de passe actuel</label>
            <div className="relative">
              <input
                name="currentPassword"
                type={showCurrentPwd ? 'text' : 'password'}
                value={userSettings.currentPassword}
                onChange={handleChange}
                className={`${inputClass('currentPassword')} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]"
              >
                {showCurrentPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {settingsErrors.currentPassword && <p className="text-[11.5px] text-red-500">{settingsErrors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Nouveau mot de passe</label>
            <div className="relative">
              <input
                name="newPassword"
                type={showNewPwd ? 'text' : 'password'}
                value={userSettings.newPassword}
                onChange={handleChange}
                className={`${inputClass('newPassword')} pr-10`}
                placeholder="Min. 6 caractères"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]"
              >
                {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {settingsErrors.newPassword && <p className="text-[11.5px] text-red-500">{settingsErrors.newPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Confirmer le mot de passe</label>
            <input
              name="confirmPassword"
              type="password"
              value={userSettings.confirmPassword}
              onChange={handleChange}
              className={inputClass('confirmPassword')}
              placeholder="Confirmer..."
            />
            {settingsErrors.confirmPassword && <p className="text-[11.5px] text-red-500">{settingsErrors.confirmPassword}</p>}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={() => navigate('/admin/accueil')}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-all"
        >
          <ArrowLeft size={14} /> Retour
        </button>
        <button
          onClick={handleSave}
          disabled={updating}
          className="flex items-center gap-2 h-9 px-6 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-px active:translate-y-0"
        >
          {updating ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</>
          ) : (
            <><Save size={14} /> Enregistrer</>
          )}
        </button>
      </div>
    </div>
  )
}