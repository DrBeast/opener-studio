import * as React from "react";
import { cn } from "@/lib/utils"; // Assuming cn utility for Tailwind class merging
import { Zap } from "lucide-react"; // Assuming Zap icon from lucide-react
import { Badge } from "@/components/ui/badge"; // Assuming your Badge component

// Re-importing your existing Card components from your design system
// Adjust paths if your design system components are in a different location
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/design-system"; // Or from "@/components/ui/card" if that's where they are

interface InfoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode; // Allow custom icon, defaults to Zap
  title?: string; // Allow custom title, defaults to "💡 Pro Tip"
  description: string; // The main tip/description text
  badges?: string[]; // Array of strings for the badges
  // You can add more props if you want to customize colors, etc.
}

const InfoBox = React.forwardRef<HTMLDivElement, InfoBoxProps>(
  (
    {
      icon = <Zap className="h-6 w-6 text-blue-600" />, // Default Zap icon
      title = "💡 Pro Tip", // Default title
      description,
      badges = [], // Default empty array for badges
      className,
      ...props
    },
    ref
  ) => (
    <Card
      ref={ref}
      // Apply the specific styling for the info box
      className={cn("bg-blue-50 border-blue-200 mb-8 shadow-none", className)}
      {...props}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {icon} {/* Render the icon prop */}
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-blue-900 mb-2">
              {title} {/* Render the title prop */}
            </CardTitle>
            <CardDescription className="text-blue-800 mb-3">
              {description} {/* Render the description prop */}
            </CardDescription>
            {badges.length > 0 && (
              <div className="flex gap-2">
                {badges.map((badgeText, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {badgeText}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
);
InfoBox.displayName = "InfoBox";

export { InfoBox };
