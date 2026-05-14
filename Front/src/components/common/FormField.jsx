import { cn } from '@/lib/utils'

function FormField({ label, id, error, hint, required, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[12.5px] font-semibold text-[var(--fg-muted)] select-none"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Inject design classes into child input/select/textarea */}
      <div className="relative">
        {children}
      </div>

      {hint && !error && (
        <p className="text-[11.5px] text-[var(--fg-subtle)]">{hint}</p>
      )}
      {error && (
        <p className="text-[11.5px] text-red-500 flex items-center gap-1">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
