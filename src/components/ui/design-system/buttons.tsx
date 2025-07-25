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
          // Tailwind: bg-purple-600 (#9333ea, hsl(262, 83%, 58%)), text-white (#fff), hover:bg-purple-700 (#7e22ce, hsl(262, 84%, 48%))
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] hover:brightness-80 shadow-none transition-all duration-200 shrink-0",

        destructive:
          // Tailwind: bg-red-600 (#dc2626, hsl(0, 84%, 60%)), text-white (#fff), hover:bg-red-700 (#b91c1c, hsl(0, 74%, 36%))
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))] hover:brightness-80 shadow-none transition-all duration-200 shrink-0",

        success:
          // Tailwind: bg-green-600 (#16a34a, hsl(142, 71%, 36%)), text-white (#fff), hover:bg-green-700 (#15803d, hsl(142, 76%, 26%))
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))] hover:brightness-80 shadow-none transition-all duration-200 shrink-0",

        option:
          // Tailwind: bg-blue-600 (#2563eb, hsl(221, 83%, 53%)), text-white (#fff), hover:bg-blue-700 (#1d4ed8, hsl(221, 77%, 44%))
          "bg-[hsl(var(--option))] text-[hsl(var(--option-foreground))] hover:bg-[hsl(var(--option))] hover:brightness-80 shadow-none transition-all duration-200 shrink-0",

        outline:
          // Tailwind: border-gray-300 (#d1d5db, hsl(220, 13%, 91%)), bg-white (#fff, hsl(0, 0%, 100%)), text-gray-700 (#374151, hsl(222, 9%, 46%)), hover:bg-gray-50 (#f9fafb, hsl(220, 20%, 98%))
          "border border-[hsl(var(--primary))] bg-[hsl(var(--background))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] shadow-none transition-all duration-200 shrink-0",

        ghost:
          // Tailwind: text-gray-700 (#374151, hsl(222, 9%, 46%)), hover:bg-gray-100 (#f3f4f6, hsl(220, 14%, 96%))
          "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",

        outlinedestructive:
          // Tailwind: bg-red-600 (#dc2626, hsl(0, 84%, 60%)), text-white (#fff), hover:bg-red-700 (#b91c1c, hsl(0, 74%, 36%))
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
        variant="outline"
        size="sm"
        className={cn(
          "h-auto px-3 py-1.5 text-sm font-normal rounded-full border-border transition-colors shadow-none hover:shadow-none", // Base styles for the chip
          isSelected
            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/80" // Selected state styles
            : "bg-background text-foreground hover:bg-primary-muted hover:border-border", // Unselected state styles
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
Chip.displayName = "Chip";
