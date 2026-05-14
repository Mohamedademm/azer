import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, hover = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)] shadow-[var(--shadow-sm)]",
      "transition-all duration-200",
      hover && "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight text-[var(--fg)]", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-[var(--fg-muted)]", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 border-t border-[var(--border)] mt-2", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

/* Stat Card — compact metric display */
const StatCard = React.forwardRef(({ className, icon, label, value, trend, trendLabel, accentColor = "#6366f1", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]",
      "transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
      className
    )}
    {...props}
  >
    <div className="flex items-start justify-between gap-4">
      {icon && (
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">{label}</p>
        <p className="text-2xl font-bold text-[var(--fg)] mt-1 leading-none">{value}</p>
        {trendLabel && (
          <p className={cn(
            "text-xs font-medium mt-1.5",
            trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-[var(--fg-muted)]"
          )}>
            {trend === "up" ? "↑ " : trend === "down" ? "↓ " : ""}{trendLabel}
          </p>
        )}
      </div>
    </div>
  </div>
))
StatCard.displayName = "StatCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard }
