
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedStatusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-all",
  {
    variants: {
      variant: {
        // Priority variants with Airtable-inspired colors
        top: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 shadow-sm",
        medium: "bg-blue-50 text-blue-700 ring-blue-600/20 shadow-sm",
        maybe: "bg-gray-50 text-gray-600 ring-gray-500/10 shadow-sm",
        
        // Status variants
        active: "bg-green-50 text-green-700 ring-green-600/20 shadow-sm",
        pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 shadow-sm",
        completed: "bg-blue-50 text-blue-700 ring-blue-600/20 shadow-sm",
        overdue: "bg-red-50 text-red-700 ring-red-600/20 shadow-sm",
        
        // Contact status variants
        contacted: "bg-purple-50 text-purple-700 ring-purple-600/20 shadow-sm",
        responded: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 shadow-sm",
        meeting: "bg-orange-50 text-orange-700 ring-orange-600/20 shadow-sm",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "maybe",
      size: "md",
    },
  }
)

export interface EnhancedStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof enhancedStatusBadgeVariants> {}

const EnhancedStatusBadge = React.forwardRef<HTMLSpanElement, EnhancedStatusBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        className={cn(enhancedStatusBadgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
EnhancedStatusBadge.displayName = "EnhancedStatusBadge"

export { EnhancedStatusBadge, enhancedStatusBadgeVariants }
