import ThemeToggle from '@/components/ThemeToggle'

export default function TopBar({ title, subtitle }) {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-() bg-()/80 backdrop-blur-xl px-6 py-4 lg:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-() truncate lg:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-() mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:block text-xs text-() border border-() rounded-lg px-3 py-1.5">
          {today}
        </span>
        <ThemeToggle />
      </div>
    </header>
  )
}
