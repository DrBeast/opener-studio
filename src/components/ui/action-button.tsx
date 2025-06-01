
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  children: React.ReactNode;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon: Icon, children, ...props }, ref) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300",
      outline: "bg-white hover:bg-gray-50 text-gray-700 border-gray-300",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-600 border-transparent"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm", 
      lg: "px-6 py-3 text-base"
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {Icon && <Icon className="mr-2 h-4 w-4" />}
        {children}
      </Button>
    );
  }
);

ActionButton.displayName = "ActionButton";
