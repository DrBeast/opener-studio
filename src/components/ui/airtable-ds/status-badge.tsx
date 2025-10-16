
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gray-100 text-gray-800",
        success: "border-transparent bg-green-100 text-green-800 ring-1 ring-green-600/20",
        warning: "border-transparent bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/20",
        info: "border-transparent bg-blue-100 text-blue-800 ring-1 ring-blue-600/20",
        destructive: "border-transparent bg-red-100 text-red-800 ring-1 ring-red-600/20",
        outline: "border-gray-200 text-gray-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  )
}

export { StatusBadge, statusBadgeVariants }
