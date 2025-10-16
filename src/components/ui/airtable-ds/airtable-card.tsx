
import * as React from "react"
import { cn } from "@/lib/utils"

const AirtableCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}
    {...props}
  />
))
AirtableCard.displayName = "AirtableCard"

const AirtableCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6 pb-4", className)}
    {...props}
  />
))
AirtableCardHeader.displayName = "AirtableCardHeader"

const AirtableCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
))
AirtableCardTitle.displayName = "AirtableCardTitle"

const AirtableCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 leading-relaxed", className)}
    {...props}
  />
))
AirtableCardDescription.displayName = "AirtableCardDescription"

const AirtableCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-2", className)} {...props} />
))
AirtableCardContent.displayName = "AirtableCardContent"

const AirtableCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-4 border-t border-gray-100", className)}
    {...props}
  />
))
AirtableCardFooter.displayName = "AirtableCardFooter"

export { 
  AirtableCard, 
  AirtableCardHeader, 
  AirtableCardFooter, 
  AirtableCardTitle, 
  AirtableCardDescription, 
  AirtableCardContent 
}
