import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: React.ReactElement;
  selector: string;
}
export default function RatingPopUp({ children, selector }: Props) {
  const [mounted, setMounted] = useState(false);

  // const overlayEl = document.getElementById("overlays");
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [selector]);

  return mounted
    ? createPortal(
        <div className='absolute top-0 left-0 right-0 bottom-0 z-50 flex h-[100vh] w-[100vw] items-center justify-center overflow-hidden bg-black/30'>
          {children}
        </div>,
        document.getElementById(selector)!
      )
    : null;
}
