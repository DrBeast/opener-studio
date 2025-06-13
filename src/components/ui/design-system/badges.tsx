
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        success: "border-transparent bg-green-100 text-green-800 ring-1 ring-green-600/20",
        warning: "border-transparent bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20",
        info: "border-transparent bg-blue-100 text-blue-800 ring-1 ring-blue-600/20",
        error: "border-transparent bg-red-100 text-red-800 ring-1 ring-red-600/20",
        neutral: "border-gray-200 text-gray-700 bg-gray-50",
        priority: "border-transparent bg-purple-100 text-purple-800 ring-1 ring-purple-600/20"
      }
    },
    defaultVariants: {
      status: "neutral"
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

// Success Badge
const SuccessBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status = "success", ...props }, ref) => (
    <div className={cn(statusBadgeVariants({ status }), className)} ref={ref} {...props} />
  )
)
SuccessBadge.displayName = "SuccessBadge"

// Warning Badge
const WarningBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status = "warning", ...props }, ref) => (
    <div className={cn(statusBadgeVariants({ status }), className)} ref={ref} {...props} />
  )
)
WarningBadge.displayName = "WarningBadge"

// Info Badge
const InfoBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status = "info", ...props }, ref) => (
    <div className={cn(statusBadgeVariants({ status }), className)} ref={ref} {...props} />
  )
)
InfoBadge.displayName = "InfoBadge"

// Error Badge
const ErrorBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status = "error", ...props }, ref) => (
    <div className={cn(statusBadgeVariants({ status }), className)} ref={ref} {...props} />
  )
)
ErrorBadge.displayName = "ErrorBadge"

// Neutral Badge
const NeutralBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status = "neutral", ...props }, ref) => (
    <div className={cn(statusBadgeVariants({ status }), className)} ref={ref} {...props} />
  )
)
NeutralBadge.displayName = "NeutralBadge"

// Priority Badge
const PriorityBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status = "priority", ...props }, ref) => (
    <div className={cn(statusBadgeVariants({ status }), className)} ref={ref} {...props} />
  )
)
PriorityBadge.displayName = "PriorityBadge"

export { 
  SuccessBadge,
  WarningBadge,
  InfoBadge,
  ErrorBadge,
  NeutralBadge,
  PriorityBadge,
  statusBadgeVariants 
}
