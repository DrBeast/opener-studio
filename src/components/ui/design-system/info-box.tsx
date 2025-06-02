
import * as React from "react"
import { cn } from "@/lib/utils"

interface InfoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

const InfoBox = React.forwardRef<HTMLDivElement, InfoBoxProps>(
  ({ className, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-blue-200 bg-blue-50 p-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="text-blue-600 mt-0.5 shrink-0">
            {React.cloneElement(icon as React.ReactElement, { 
              className: "h-5 w-5" 
            })}
          </div>
        )}
        <div className="text-sm text-blue-800">
          {children}
        </div>
      </div>
    </div>
  )
)
InfoBox.displayName = "InfoBox"

export { InfoBox }
