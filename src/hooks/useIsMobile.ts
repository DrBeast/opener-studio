import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device
 * Uses both user agent detection and screen width for reliability
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width (common mobile breakpoint)
      const isSmallScreen = window.innerWidth < 768;

      // Check user agent for mobile keywords
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileUserAgent = mobileRegex.test(userAgent);

      // Consider mobile if either condition is true
      setIsMobile(isSmallScreen || isMobileUserAgent);
    };

    // Check on mount
    checkMobile();

    // Check on window resize (in case user resizes browser)
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
};

