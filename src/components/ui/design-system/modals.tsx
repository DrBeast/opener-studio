import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/airtable-ds/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  headerClassName?: string;
  titleClassName?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  className,
  headerClassName,
  titleClassName,
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-md",
          className
        )}
      >
        <DialogHeader className={cn("p-6", headerClassName)}>
          {/* 1. Main container using Flexbox */}
          <div className="flex items-center gap-4">
            {/* 2. Icon Container (Left) */}
            {icon && <div className="text-primary">{icon}</div>}

            {/* 3. Text Container for Title and Description (Right) */}
            <div className="flex flex-col">
              <DialogTitle
                className={cn(
                  "text-xl font-semibold text-foreground",
                  titleClassName
                )}
              >
                {title}
              </DialogTitle>
              {description && (
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="text-[hsl(var(--foreground))]">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export { Modal };
