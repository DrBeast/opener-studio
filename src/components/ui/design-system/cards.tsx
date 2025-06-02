import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/design-system";
import { Badge } from "@/components/ui/badge";

// Standard Card - consistent across all pages
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// Primary Card variant
const PrimaryCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn("border-gray-200 shadow-sm", className)}
    {...props}
  />
));
PrimaryCard.displayName = "PrimaryCard";

// Info box card variant
interface InfoBoxProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  badges?: Array<{ label: string; className?: string }>;
  className?: string;
  children?: React.ReactNode;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  icon,
  title,
  description,
  badges,
  className = "",
  children,
}) => (
  <Card className={`bg-blue-50 border-blue-200 ${className}`}>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {title}
            </h3>
          )}
          {description && <p className="text-blue-800 mb-3">{description}</p>}
          {children}
          {badges && badges.length > 0 && (
            <div className="flex gap-2 mt-2">
              {badges.map((badge, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={`bg-blue-100 text-blue-800 ${
                    badge.className || ""
                  }`}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);
InfoBox.displayName = "InfoBox";

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// Card Title
const CardTitle = React.forwardRef<
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
));
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-600", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  PrimaryCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
