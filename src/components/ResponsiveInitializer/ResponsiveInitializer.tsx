import { useEffect } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

export const ResponsiveInitializer = () => {
  const setIsMobile = useResponsiveStore((state) => state.setIsMobile);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [setIsMobile]);

  return null;
};
