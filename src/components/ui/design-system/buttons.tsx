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
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-none transition-all duration-200 shrink-0",

        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))] hover:brightness-80 shadow-none transition-all duration-200 shrink-0",

        success:
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))] hover:brightness-80 shadow-none transition-all duration-200 shrink-0",

        option:
          "border border-secondary-foreground bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-none transition-all duration-200 shrink-0",

        outline:
          "border border-primary bg-background text-primary hover:bg-primary-muted shadow-none transition-all duration-200 shrink-0",

        ghost:
          "text-muted-foreground border-muted-foreground hover:text-foreground",

        outlinedestructive:
          "border border-[hsl(var(--destructive))] bg-[hsl(var(--background))] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--muted))] shadow-none transition-all duration-200 shrink-0",
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
  icon?: React.ReactNode;
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
      icon,
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
        "w-full flex items-center justify-between h-14 text-base font-medium border-none shadow-none hover:shadow-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="text-primary">{icon}</div>}
        <span>{children}</span>
      </div>
      {/* Render the chevron icon based on the expanded state */}
      {expanded ? (
        <ChevronUp className="h-5 w-5" />
      ) : (
        <ChevronDown className="h-5 w-5" />
      )}
    </Button>
  )
);
CollapsibleWide.displayName = "CollapsibleWide";

// Chip Component for selectable options, inspired by Airtable
interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSelected: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ isSelected, children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={
          isSelected
            ? "primary" // Active style
            : "option" // Inactive style
        }
        size="sm"
        className={
          "h-auto px-3 py-1.5 text-sm font-normal rounded-full  transition-colors shadow-none hover:shadow-none"
        }
        {...props}
      >
        {children}
      </Button>
    );
  }
);
Chip.displayName = "Chip";
