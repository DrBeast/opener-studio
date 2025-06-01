
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        green: "bg-green-50 text-green-700 ring-green-600/20",
        blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
        yellow: "bg-yellow-50 text-yellow-700 ring-yellow-600/20", 
        red: "bg-red-50 text-red-700 ring-red-600/20",
        orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
        gray: "bg-gray-50 text-gray-600 ring-gray-500/10",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs",
        lg: "px-2.5 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "gray",
      size: "md",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        className={cn(statusBadgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge, statusBadgeVariants }
