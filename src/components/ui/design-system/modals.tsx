
import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Standard Modal - consistent with Dashboard "Find contacts" modal style
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
  className 
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-lg", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-2">
            {icon && (
              <div className="text-purple-600">
                {React.cloneElement(icon as React.ReactElement, { 
                  className: "h-5 w-5" 
                })}
              </div>
            )}
            {title}
          </DialogTitle>
          {description && (
            <div className="text-sm text-[hsl(var(--foreground))] mb-4">
              {description}
            </div>
          )}
        </DialogHeader>
        <div className="text-[hsl(var(--foreground))]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Action Modal - same styling as Modal but with ActionModal name for consistency
const ActionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  description,
  icon,
  children, 
  className 
}: ModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-lg", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2 mb-2">
            {icon && (
              <div className="text-purple-600">
                {React.cloneElement(icon as React.ReactElement, { 
                  className: "h-5 w-5" 
                })}
              </div>
            )}
            {title}
          </DialogTitle>
          {description && (
            <div className="text-sm text-[hsl(var(--foreground))] mb-4">
              {description}
            </div>
          )}
        </DialogHeader>
        <div className="text-[hsl(var(--foreground))]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { Modal, ActionModal }
