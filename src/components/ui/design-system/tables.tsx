
import * as React from "react"
import { cn } from "@/lib/utils"

// Data Table Container
const DataTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  </div>
))
DataTable.displayName = "DataTable"

// Table Header
const DataTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-gray-50/50 [&_tr]:border-b", className)} {...props} />
))
DataTableHeader.displayName = "DataTableHeader"

// Table Body
const DataTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
DataTableBody.displayName = "DataTableBody"

// Table Row
const DataTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "cursor-pointer hover:bg-gray-50/80 transition-colors border-b border-gray-100",
      className
    )}
    {...props}
  />
))
DataTableRow.displayName = "DataTableRow"

// Table Header Cell
const DataTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "font-semibold text-gray-700 text-left align-middle px-4 py-4 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
DataTableHead.displayName = "DataTableHead"

// Table Cell
const DataTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("align-middle px-4 py-4 [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
DataTableCell.displayName = "DataTableCell"

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
}
