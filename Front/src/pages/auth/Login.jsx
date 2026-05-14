import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';
import { isAuthenticated, getUserRole, getHomePathForRole } from '../../utils/auth';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getHomePathForRole(getUserRole()), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        navigate(getHomePathForRole(result.user.role), { replace: true });
      } else {
        setError(result.message || 'Identifiants incorrects');
      }
    } catch {
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg-mesh" />
      <div className="login-grid" />

      {/* Floating particles (subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width:  `${[4,6,3,5,4,3][i]}px`,
              height: `${[4,6,3,5,4,3][i]}px`,
              background: '#6366f1',
              top:  `${[15,70,40,85,25,60][i]}%`,
              left: `${[20,75,50,30,80,10][i]}%`,
              animation: `pulse-slow ${[3,4,3.5,5,2.5,4][i]}s ease-in-out infinite`,
              animationDelay: `${[0,1,2,0.5,1.5,2.5][i]}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top glow line */}
        <div className="login-card-glow" />

        {/* Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2"   width="12" height="12" rx="3" fill="white" opacity="1"   />
              <rect x="18" y="2"  width="12" height="12" rx="3" fill="white" opacity="0.6" />
              <rect x="2" y="18"  width="12" height="12" rx="3" fill="white" opacity="0.6" />
              <rect x="18" y="18" width="12" height="12" rx="3" fill="white" opacity="0.3" />
            </svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-2xl font-bold text-white tracking-tight"
          >
            Azer ERP
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-sm text-slate-400 mt-1"
          >
            Connectez-vous à votre espace de gestion
          </motion.p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mb-6" />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="flex items-center gap-2.5 mb-5 px-4 py-3 rounded-lg bg-red-500/12 border border-red-500/20 text-red-400 text-sm"
              role="alert"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" className="flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-[12.5px] font-semibold text-slate-400 tracking-wide">
              Adresse email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Mail size={15} />
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                disabled={loading}
                autoComplete="email"
                className={[
                  'w-full h-11 pl-10 pr-4 rounded-xl text-sm',
                  'bg-white/5 border border-white/10 text-white',
                  'placeholder:text-slate-600',
                  'outline-none transition-all duration-150',
                  'focus:bg-white/7 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-[12.5px] font-semibold text-slate-400 tracking-wide">
              Mot de passe
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Lock size={15} />
              </span>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
                className={[
                  'w-full h-11 pl-10 pr-11 rounded-xl text-sm',
                  'bg-white/5 border border-white/10 text-white',
                  'placeholder:text-slate-600',
                  'outline-none transition-all duration-150',
                  'focus:bg-white/7 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                aria-label={showPwd ? 'Masquer' : 'Afficher'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.99 } : {}}
            className={[
              'flex items-center justify-center gap-2 mt-2 w-full h-11 rounded-xl',
              'text-sm font-bold text-white',
              'bg-gradient-to-r from-indigo-600 to-violet-600',
              'shadow-lg shadow-indigo-500/30',
              'transition-all duration-200',
              'hover:shadow-indigo-500/50 hover:from-indigo-500 hover:to-violet-500',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
            ].join(' ')}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11.5px] text-slate-600 mt-6">
          Azer ERP — Plateforme de gestion intégrée
        </p>
      </motion.div>
    </div>
  );
}
