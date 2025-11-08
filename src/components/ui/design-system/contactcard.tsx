import * as React from "react";
import { cn } from "@/lib/utils";

interface ContactCardProps extends React.HTMLAttributes<HTMLDivElement> {
  firstName: string;
  lastName: string;
  role?: string;
  company?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const ContactCard = React.forwardRef<HTMLDivElement, ContactCardProps>(
  (
    {
      className,
      firstName,
      lastName,
      role,
      company,
      isSelected = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const initials = `${firstName?.[0] || ""}${
      lastName?.[0] || ""
    }`.toUpperCase();

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer bg-card text-card-foreground",
          // className="group  hover:shadow-md hover:border-primary-hover hover:bg-accent-hover"
          isSelected
            ? "border-primary bg-primary-muted shadow-sm hover:border-primary "
            : "border-border hover:border-primary hover:bg-primary-hover",
          className
        )}
        {...props}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {initials || "?"}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="space-y-1">
            <h4 className="font-medium text-sm text-foreground">
              {firstName} {lastName}
            </h4>
            {role && company && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {role} at {company}
              </p>
            )}
            {role && !company && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {role}
              </p>
            )}
            {!role && company && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {company}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ContactCard.displayName = "ContactCard";

export { ContactCard };
