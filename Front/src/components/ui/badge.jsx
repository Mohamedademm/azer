import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-indigo-500/20 bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
        secondary:
          "border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg-muted)]",
        destructive:
          "border-red-500/20 bg-red-500/12 text-red-600 dark:text-red-400",
        success:
          "border-emerald-500/20 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/12 text-amber-600 dark:text-amber-400",
        info:
          "border-blue-500/20 bg-blue-500/12 text-blue-600 dark:text-blue-400",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, dot = false, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      )}
      {props.children}
    </div>
  )
}

export { Badge, badgeVariants }
