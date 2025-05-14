
// No-op toast implementation that just logs to the console
const useToast = () => {
  return {
    toast: (props: any) => {
      console.log("Toast:", props.title, props.description);
      return { id: "1", dismiss: () => {} };
    },
    dismiss: (toastId?: string) => {
      console.log("Dismissing toast:", toastId);
    },
    toasts: [],
  };
};

// Simplified toast function with error and success methods
const toast = (props: any) => {
  console.log("Toast:", props.title, props.description);
  return { id: "1", dismiss: () => {} };
};

// Add error and success methods
toast.error = (message: string) => {
  console.log("Toast error:", message);
  return { id: "1", dismiss: () => {} };
};

toast.success = (message: string) => {
  console.log("Toast success:", message);
  return { id: "1", dismiss: () => {} };
};

export { useToast, toast };
