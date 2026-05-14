import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="table-wrap">
    <div className="table-responsive">
      <table ref={ref} className={cn("w-full text-sm", className)} {...props} />
    </div>
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-[var(--bg-subtle)] border-b border-[var(--border)]", className)}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-[var(--border)]", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-[var(--bg-subtle)] border-t border-[var(--border)] font-medium", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors hover:bg-[var(--bg-card-hover)] data-[state=selected]:bg-indigo-500/5",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] whitespace-nowrap",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-3 text-[13.5px] text-[var(--fg)] align-middle", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-[var(--fg-muted)]", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

/* Empty State for tables */
const TableEmpty = ({ message = "Aucun résultat trouvé", icon }) => (
  <tr>
    <td colSpan={100} className="px-4 py-16 text-center text-[var(--fg-muted)]">
      <div className="flex flex-col items-center gap-3">
        {icon && <div className="text-3xl text-[var(--fg-subtle)]">{icon}</div>}
        <p className="font-medium">{message}</p>
      </div>
    </td>
  </tr>
)

export {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption, TableEmpty,
}
