import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "transition-all duration-150 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white border border-indigo-600 shadow-sm hover:bg-indigo-700 hover:shadow-md active:translate-y-px",
        secondary:
          "bg-transparent text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]",
        ghost:
          "bg-transparent text-[var(--fg-muted)] border border-transparent hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]",
        destructive:
          "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/18 hover:border-red-500/40",
        success:
          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/18 hover:border-emerald-500/40",
        warning:
          "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/18 hover:border-amber-500/40",
        outline:
          "bg-transparent text-indigo-600 border border-indigo-300 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-500/30 dark:hover:bg-indigo-500/10",
        link:
          "text-indigo-600 underline-offset-4 hover:underline border-0 bg-transparent shadow-none dark:text-indigo-400",
      },
      size: {
        sm:      "h-8 px-3 text-xs rounded-md",
        default: "h-9 px-4 text-sm rounded-lg",
        lg:      "h-11 px-6 text-base rounded-xl",
        xl:      "h-13 px-8 text-base rounded-xl",
        icon:    "h-9 w-9 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
