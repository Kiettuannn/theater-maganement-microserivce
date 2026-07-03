import { useEffect, useState } from "react";

/**
 * Custom hook to detect if the browser tab is visible or hidden
 * @returns {boolean} isVisible - true if tab is visible, false if hidden
 */
export const useTabVisibility = (): boolean => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
};
