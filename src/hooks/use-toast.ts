
// Import the toast library
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export function toast({
  title,
  description,
  variant = "default",
  action,
  ...props
}: ToastProps) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      action,
      ...props,
    });
  }

  return sonnerToast(title, {
    description,
    action,
    ...props,
  });
}

export const useToast = () => {
  return {
    toast,
  };
};
