import { useEffect, useState } from "react";

export const useIsLandscape = (): boolean => {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");

    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsLandscape(e.matches);
    };

    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isLandscape;
};
