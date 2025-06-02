import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2",
  {
    variants: {
      variant: {
        primary: "bg-purple-600 text-white hover:bg-purple-700",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 ",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-700 hover:bg-gray-100",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        success: "bg-green-600 text-white hover:bg-green-700",
        //     option: "bg-blue-600 text-white hover:bg-green-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Action Button Variants
const PrimaryAction = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="primary"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
);
PrimaryAction.displayName = "PrimaryAction";

const OutlineAction = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
);
OutlineAction.displayName = "OutlineAction";

const GhostAction = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button ref={ref} variant="ghost" className={className} {...props} />
  )
);
GhostAction.displayName = "GhostAction";

export { Button, PrimaryAction, OutlineAction, GhostAction, buttonVariants };

// Collapsible Trigger Button Component
interface CollapsibleTriggerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  expanded: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export const CollapsibleWide = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerButtonProps
>(
  (
    {
      expanded,
      children,
      className = "",
      variant = "outline",
      size = "default",
      ...props
    },
    ref
  ) => (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "w-full flex items-center justify-between h-14 text-base font-medium border-2",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {expanded ? (
        <ChevronUp className="h-5 w-5" />
      ) : (
        <ChevronDown className="h-5 w-5" />
      )}
    </Button>
  )
);
CollapsibleWide.displayName = "CollapsibleWide";
