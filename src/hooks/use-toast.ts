
// Create a no-op toast implementation

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

// This is a no-op implementation that doesn't display any toasts
export function toast({
  title,
  description,
  variant = "default",
  action,
  ...props
}: ToastProps) {
  // Log to console instead of showing a toast
  console.log('[Toast disabled]', { title, description, variant });
  return 0; // Return a dummy ID
}

// Add standard toast methods as no-ops
toast.success = (message: string, options?: any) => {
  console.log('[Toast success disabled]', message, options);
  return 0;
};

toast.error = (message: string, options?: any) => {
  console.log('[Toast error disabled]', message, options);
  return 0;
};

toast.info = (message: string, options?: any) => {
  console.log('[Toast info disabled]', message, options);
  return 0;
};

toast.warning = (message: string, options?: any) => {
  console.log('[Toast warning disabled]', message, options);
  return 0;
};

export const useToast = () => {
  return {
    toast,
  };
};
