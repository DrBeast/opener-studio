import * as React from "react";
import { cn } from "@/lib/utils";

// Page Title
const PageTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-3xl font-bold text-[hsl(var(--foreground))] mb-2",
      className
    )}
    {...props}
  />
));
PageTitle.displayName = "PageTitle";

// Section Title
const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-xl font-semibold text-[hsl(var(--normaltext))]",
      className
    )}
    {...props}
  />
));
SectionTitle.displayName = "SectionTitle";

// Page Description
const PageDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[hsl(var(--normaltext))]", className)}
    {...props}
  />
));
PageDescription.displayName = "PageDescription";

export { PageTitle, SectionTitle, PageDescription };
