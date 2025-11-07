
import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipcardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  icon2?: React.ReactNode;
  children?: React.ReactNode;
}

const Chipcard = React.forwardRef<HTMLDivElement, ChipcardProps>(
  (
    {
      className,
      title,
      subtitle,
      description,
      icon,
      icon2,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-4 bg-card text-card-foreground border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/40 hover:bg-muted/40",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
          <div className="flex items-left gap-1">
            {icon2 && (
              <div className="p-0 bg-card rounded-lg flex-shrink-0 text-muted-foreground ">
                {icon2}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
      )}
    </div>
  )
);
Chipcard.displayName = "Chipcard";

export { Chipcard };
