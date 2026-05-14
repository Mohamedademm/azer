import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg px-3 py-2 text-sm",
      "bg-[var(--bg-card)] text-[var(--fg)]",
      "border border-[var(--border)]",
      "placeholder:text-[var(--fg-subtle)]",
      "outline-none",
      "transition-all duration-150",
      "hover:border-[var(--border-strong)]",
      "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

/* Textarea */
const Textarea = React.forwardRef(({ className, error, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-lg px-3 py-2 text-sm",
      "bg-[var(--bg-card)] text-[var(--fg)]",
      "border border-[var(--border)]",
      "placeholder:text-[var(--fg-subtle)]",
      "outline-none resize-y",
      "transition-all duration-150",
      "hover:border-[var(--border-strong)]",
      "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

/* Select */
const Select = React.forwardRef(({ className, error, ...props }, ref) => (
  <select
    className={cn(
      "flex h-10 w-full rounded-lg px-3 py-2 text-sm",
      "bg-[var(--bg-card)] text-[var(--fg)]",
      "border border-[var(--border)]",
      "outline-none",
      "transition-all duration-150",
      "hover:border-[var(--border-strong)]",
      "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "cursor-pointer",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      className
    )}
    ref={ref}
    {...props}
  />
))
Select.displayName = "Select"

export { Input, Textarea, Select }
