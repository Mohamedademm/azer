import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg",
        "border border-[var(--border)] bg-[var(--bg-card)]",
        "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]",
        "transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
        >
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </motion.div>
      </AnimatePresence>
    </button>
  )
}
