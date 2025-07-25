import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  className,
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-secondary border border-gray-200 shadow-md",
          className
        )}
      >
        <DialogHeader>
          {/* 1. Main container using Flexbox */}
          <div className="flex items-center gap-4">
            {/* 2. Icon Container (Left) */}
            {icon && (
              <div className="text-primary">
                {React.cloneElement(icon as React.ReactElement, {
                  className: "h-10 w-10",
                })}
              </div>
            )}

            {/* 3. Text Container for Title and Description (Right) */}
            <div className="flex flex-col">
              <DialogTitle className="text-xl font-semibold text-foreground">
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
