
import { Console } from "console";

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

// Simplified toast function
const toast = (props: any) => {
  console.log("Toast:", props.title, props.description);
  return { id: "1", dismiss: () => {} };
};

export { useToast, toast };
