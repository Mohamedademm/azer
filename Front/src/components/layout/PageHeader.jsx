import { cn } from '@/lib/utils'

export default function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-()">{title}</h2>
        {description && (
          <p className="text-sm text-()">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
