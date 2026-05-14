import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Save, Lock, User, Mail, Phone, Building, AlertTriangle, CheckCircle } from 'lucide-react'
import userService from '../../../services/userService'
import { extractApiErrorMessage } from '../../../utils/frontendApiAdapters'
import { getUserRole } from '../../../utils/auth'
import FormField from '../../../components/common/FormField'

const inputClass = "form-input"

function SettingsPage({ showNotif }) {
  const [ur] = useState(() => getUserRole())
  const [us, setUs] = useState({ firstName: "", lastName: "", email: "", phone: "", department: "", role: "", currentPassword: "", newPassword: "", confirmPassword: "" })
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' })
  const [upd, setUpd] = useState(false)

  const notify = (type, text) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg({ type: '', text: '' }), 3500)
    if (showNotif) showNotif(text, type)
  }

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      const profileResponse = await userService.getProfile()
      const profile = profileResponse?.data || profileResponse
      setUs({
        firstName: profile?.firstName || "Gestionnaire",
        lastName: profile?.lastName || "Stock",
        email: profile?.email || "",
        phone: profile?.phone || "",
        department: profile?.department || "Gestion des stocks",
        role: profile?.role || ur || "admin_stock",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error) {
      notify('error', extractApiErrorMessage(error, "Impossible de charger le profil"))
    }
  }, [ur])

  useEffect(() => { loadProfile() }, [loadProfile])

  // Handlers
  const hdlSetChange = e => {
    const { name, value } = e.target
    setUs(prev => ({ ...prev, [name]: value }))
  }

  const hdlSave = async () => {
    if (!us.firstName) return notify('error', "Prénom requis")
    if (!us.lastName) return notify('error', "Nom requis")
    if (!us.email) return notify('error', "Email requis")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(us.email)) return notify('error', "Email invalide")
    if (us.phone && !/^[0-9+\-\s]+$/.test(us.phone)) return notify('error', "Téléphone invalide")

    const cp = us.newPassword || us.confirmPassword || us.currentPassword
    if (cp) {
      if (!us.currentPassword) return notify('error', "Mot de passe actuel requis")
      if (us.newPassword !== us.confirmPassword) return notify('error', "Mots de passe différents")
      if (us.newPassword.length < 6) return notify('error', "Minimum 6 caractères pour le mot de passe")
    }

    setUpd(true)
    try {
      await userService.updateProfile({
        firstName: us.firstName,
        lastName: us.lastName,
        email: us.email,
        phone: us.phone,
        department: us.department
      })

      if (cp) {
        await userService.changePassword(us.currentPassword, us.newPassword)
      }

      await loadProfile()
      notify('success', "Profil mis à jour avec succès")
    } catch (error) {
      notify('error', extractApiErrorMessage(error, "Impossible de mettre à jour le profil"))
    } finally {
      setUpd(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
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
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fg)]">Paramètres du profil</h1>
            <p className="text-xs text-[var(--fg-muted)]">Gérez vos informations personnelles et préférences</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* ── Personal Info ── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2 mb-5 uppercase tracking-wider">
            <User size={16} className="text-blue-500" /> Informations Personnelles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Prénom" id="p-first"><input type="text" id="p-first" name="firstName" value={us.firstName} onChange={hdlSetChange} className={inputClass} placeholder="Votre prénom" /></FormField>
            <FormField label="Nom" id="p-last"><input type="text" id="p-last" name="lastName" value={us.lastName} onChange={hdlSetChange} className={inputClass} placeholder="Votre nom" /></FormField>
            <FormField label="Email" id="p-email"><div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" /><input type="email" id="p-email" name="email" value={us.email} onChange={hdlSetChange} className={`${inputClass} pl-9`} placeholder="vous@exemple.com" /></div></FormField>
            <FormField label="Téléphone" id="p-phone"><div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]" /><input type="tel" id="p-phone" name="phone" value={us.phone} onChange={hdlSetChange} className={`${inputClass} pl-9`} placeholder="+216 ..." /></div></FormField>
          </div>
        </div>

        {/* ── Professional Info ── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2 mb-5 uppercase tracking-wider">
            <Building size={16} className="text-emerald-500" /> Informations Professionnelles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Département" id="p-dept"><input type="text" id="p-dept" name="department" value={us.department} onChange={hdlSetChange} className={inputClass} placeholder="Votre département" /></FormField>
            <FormField label="Rôle (Non modifiable)" id="p-role"><input type="text" id="p-role" value={us.role} disabled className={`${inputClass} bg-[var(--bg-subtle)] opacity-70`} /></FormField>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2 mb-5 uppercase tracking-wider">
            <Lock size={16} className="text-rose-500" /> Sécurité & Mot de passe
          </h2>
          <p className="text-xs text-[var(--fg-muted)] mb-4">Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe.</p>
          <div className="grid grid-cols-1 gap-5">
            <FormField label="Mot de passe actuel" id="p-curr"><input type="password" id="p-curr" name="currentPassword" value={us.currentPassword} onChange={hdlSetChange} className={inputClass} placeholder="••••••••" /></FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Nouveau mot de passe" id="p-new"><input type="password" id="p-new" name="newPassword" value={us.newPassword} onChange={hdlSetChange} className={inputClass} placeholder="••••••••" /></FormField>
              <FormField label="Confirmer le mot de passe" id="p-conf"><input type="password" id="p-conf" name="confirmPassword" value={us.confirmPassword} onChange={hdlSetChange} className={inputClass} placeholder="••••••••" /></FormField>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={hdlSave} disabled={upd} className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px disabled:opacity-50 disabled:pointer-events-none">
            {upd ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {upd ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default SettingsPage
