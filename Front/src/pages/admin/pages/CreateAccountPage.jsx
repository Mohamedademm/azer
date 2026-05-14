// src/pages/admin/pages/CreateAccountPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Save, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import userService from '../../../services/userService'
import { extractApiErrorMessage } from '../../../utils/frontendApiAdapters'

const ROLE_OPTIONS = [
  { value: 'employe', label: 'Employé', department: 'administration' },
  { value: 'admin_finance', label: 'Admin finance', department: 'finance' },
  { value: 'admin_facture', label: 'Admin facturation', department: 'facturation' },
  { value: 'admin_stock', label: 'Admin stock', department: 'stock' },
  { value: 'admin_principal', label: 'Admin principal', department: 'administration' },
]

const DEPARTMENT_OPTIONS = [
  { value: 'administration', label: 'Administration' },
  { value: 'finance', label: 'Finance' },
  { value: 'facturation', label: 'Facturation' },
  { value: 'stock', label: 'Stock' },
]

export default function CreateAccountPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    role: 'employe', department: 'administration',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfPwd, setShowConfPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    const selectedRole = name === 'role' ? ROLE_OPTIONS.find(o => o.value === value) : null

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(selectedRole ? { department: selectedRole.department } : {})
    }))

    setErrors(prev => {
      const next = { ...prev }
      delete next[name]
      if (name === 'password' || name === 'confirmPassword') {
        delete next.password; delete next.confirmPassword
      }
      return next
    })
    if (message.type === 'error') setMessage({ type: '', text: '' })
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.firstName.trim()) nextErrors.firstName = 'Prénom requis'
    if (!formData.lastName.trim()) nextErrors.lastName = 'Nom requis'
    if (!formData.email.trim()) {
      nextErrors.email = 'Email requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Format d'email invalide"
    }
    if (!formData.password) {
      nextErrors.password = 'Mot de passe requis'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Minimum 6 caractères'
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirmation requise'
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    if (!formData.role.trim()) nextErrors.role = 'Rôle requis'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setMessage({ type: 'error', text: 'Veuillez corriger les champs indiqués.' })
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setMessage({ type: 'info', text: 'Création du compte en cours...' })

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role.trim(),
        department: formData.department.trim(),
      }
      const res = await userService.createUser(payload)

      setErrors({})
      setMessage({
        type: res?.emailSent === false ? 'info' : 'success',
        text: res?.emailSent === false
          ? 'Compte créé (Email non envoyé : SMTP non configuré).'
          : 'Compte créé avec succès. Un email a été envoyé.'
      })
      setFormData({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        role: 'employe', department: 'administration'
      })
      setTimeout(() => navigate('/admin/accueil'), 2000)
    } catch (err) {
      setMessage({ type: 'error', text: extractApiErrorMessage(err, 'La création du compte a échoué') })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) => [
    'form-input',
    errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
  ].join(' ')

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-500">
          <UserPlus size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">Créer un compte</h1>
          <p className="text-xs text-[var(--fg-muted)]">Ajouter un nouvel utilisateur au système</p>
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              message.type === 'error'   ? 'bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400' :
              'bg-indigo-500/8 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {message.type === 'success' && <CheckCircle size={16} />}
            {message.type === 'error' && <XCircle size={16} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Prénom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Prénom <span className="text-red-500">*</span></label>
            <input name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass('firstName')} placeholder="Prénom" />
            {errors.firstName && <p className="text-[11.5px] text-red-500">{errors.firstName}</p>}
          </div>

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Nom <span className="text-red-500">*</span></label>
            <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass('lastName')} placeholder="Nom de famille" />
            {errors.lastName && <p className="text-[11.5px] text-red-500">{errors.lastName}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Email <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass('email')} placeholder="email@exemple.com" />
            {errors.email && <p className="text-[11.5px] text-red-500">{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Mot de passe <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${inputClass('password')} pr-10`} placeholder="Minimum 6 caractères" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-[11.5px] text-red-500">{errors.password}</p>}
          </div>

          {/* Confirmer Mot de passe */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Confirmer <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showConfPwd ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`${inputClass('confirmPassword')} pr-10`} placeholder="Confirmer le mot de passe" />
              <button type="button" onClick={() => setShowConfPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
                {showConfPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[11.5px] text-red-500">{errors.confirmPassword}</p>}
          </div>

          {/* Rôle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Rôle <span className="text-red-500">*</span></label>
            <select name="role" value={formData.role} onChange={handleChange} className={`${inputClass('role')} cursor-pointer`}>
              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errors.role && <p className="text-[11.5px] text-red-500">{errors.role}</p>}
          </div>

          {/* Département */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[var(--fg-muted)]">Département</label>
            <select name="department" value={formData.department} onChange={handleChange} className={`${inputClass('department')} cursor-pointer bg-[var(--bg-subtle)]`}>
              {DEPARTMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
          <button
            type="button"
            onClick={() => navigate('/admin/accueil')}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--fg)] transition-all"
          >
            <ArrowLeft size={14} /> Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 h-9 px-6 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/25 transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création...</>
            ) : (
              <><Save size={14} /> Créer le compte</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
