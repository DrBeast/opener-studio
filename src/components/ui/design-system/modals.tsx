
import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Standard Modal - based on the Dashboard "Find contacts" modal style
interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const StandardModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: StandardModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white border border-gray-200 shadow-lg", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

// Action Modal - for forms and actions (same styling as StandardModal)
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ActionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  className 
}: ActionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md bg-white border border-gray-200 shadow-lg", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {icon && (
              <div className="text-purple-600">
                {React.cloneElement(icon as React.ReactElement, { 
                  className: "h-5 w-5" 
                })}
              </div>
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export { StandardModal, ActionModal }
