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
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))] hover:brightness-50",

        destructive:
          // Tailwind: bg-red-600 (#dc2626, hsl(0, 84%, 60%)), text-white (#fff), hover:bg-red-700 (#b91c1c, hsl(0, 74%, 36%))
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))] hover:brightness-70",

        success:
          // Tailwind: bg-green-600 (#16a34a, hsl(142, 71%, 36%)), text-white (#fff), hover:bg-green-700 (#15803d, hsl(142, 76%, 26%))
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))] hover:brightness-60",

        option:
          // Tailwind: bg-blue-600 (#2563eb, hsl(221, 83%, 53%)), text-white (#fff), hover:bg-blue-700 (#1d4ed8, hsl(221, 77%, 44%))
          "bg-[hsl(var(--option))] text-[hsl(var(--option-foreground))] hover:bg-[hsl(var(--option))] hover:brightness-80",

        outline:
          // Tailwind: border-gray-300 (#d1d5db, hsl(220, 13%, 91%)), bg-white (#fff, hsl(0, 0%, 100%)), text-gray-700 (#374151, hsl(222, 9%, 46%)), hover:bg-gray-50 (#f9fafb, hsl(220, 20%, 98%))
          "border border-[hsl(var(--primary))] bg-[hsl(var(--background))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] shadow-sm",

        ghost:
          // Tailwind: text-gray-700 (#374151, hsl(222, 9%, 46%)), hover:bg-gray-100 (#f3f4f6, hsl(220, 14%, 96%))
          "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",

        secondary:
          // Tailwind: bg-gray-100 (#f3f4f6, hsl(220, 14%, 96%)), text-gray-900 (#111827, hsl(222, 47%, 11%)), hover:bg-gray-200 (#e5e7eb, hsl(220, 13%, 91%)), border-gray-300 (#d1d5db, hsl(220, 13%, 91%))
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))] hover:brightness-95 border border-[hsl(var(--border))]",
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
