
import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Action Modal - for forms and actions
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
      <DialogContent className={cn("sm:max-w-md bg-white border-0 shadow-2xl", className)}>
        <DialogHeader className="text-center pb-4">
          {icon && (
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-green-600">
                {React.cloneElement(icon as React.ReactElement, { 
                  className: "h-6 w-6 text-white" 
                })}
              </div>
            </div>
          )}
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

// Info Modal - for displaying information
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className 
}: InfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-lg bg-white border-0 shadow-2xl", className)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export { ActionModal, InfoModal }
