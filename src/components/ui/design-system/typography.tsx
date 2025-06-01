
import * as React from "react"
import { cn } from "@/lib/utils"

// Page Title
const PageTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-3xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
))
PageTitle.displayName = "PageTitle"

// Section Title
const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-xl font-semibold text-gray-900",
      className
    )}
    {...props}
  />
))
SectionTitle.displayName = "SectionTitle"

// Page Description
const PageDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-gray-600", className)}
    {...props}
  />
))
PageDescription.displayName = "PageDescription"

// Info Box
const InfoBox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { icon?: React.ReactNode }
>(({ className, icon, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-gradient-to-r from-purple-100/50 to-green-100/50 p-6 rounded-xl border border-purple-200 shadow-sm",
      className
    )}
    {...props}
  >
    <div className="flex items-start gap-3">
      {icon && (
        <div className="text-purple-600 mt-0.5 shrink-0">
          {React.cloneElement(icon as React.ReactElement, { 
            className: "h-6 w-6" 
          })}
        </div>
      )}
      <div className="text-purple-800">
        {children}
      </div>
    </div>
  </div>
))
InfoBox.displayName = "InfoBox"

export { PageTitle, SectionTitle, PageDescription, InfoBox }
