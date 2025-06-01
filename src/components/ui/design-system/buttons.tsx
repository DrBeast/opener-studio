
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const actionButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        primary: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 shadow-sm",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      intent: "primary",
      size: "default"
    }
  }
)

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  asChild?: boolean
}

// Primary Action Button
const PrimaryAction = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, intent = "primary", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(actionButtonVariants({ intent, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
PrimaryAction.displayName = "PrimaryAction"

// Secondary Action Button
const SecondaryAction = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, intent = "secondary", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(actionButtonVariants({ intent, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
SecondaryAction.displayName = "SecondaryAction"

// Outline Action Button
const OutlineAction = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, intent = "outline", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(actionButtonVariants({ intent, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
OutlineAction.displayName = "OutlineAction"

// Ghost Action Button
const GhostAction = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, intent = "ghost", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(actionButtonVariants({ intent, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GhostAction.displayName = "GhostAction"

// Destructive Action Button
const DestructiveAction = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, intent = "destructive", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(actionButtonVariants({ intent, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
DestructiveAction.displayName = "DestructiveAction"

export { 
  PrimaryAction, 
  SecondaryAction, 
  OutlineAction, 
  GhostAction, 
  DestructiveAction,
  actionButtonVariants 
}
