import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: React.ReactElement;
  selector: string;
}
export default function RatingPopUp({ children, selector }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [selector]);

  return mounted
    ? createPortal(
        <div className='fixed left-0 top-0 bottom-0 z-50 flex h-full w-full justify-center overflow-y-auto overflow-x-hidden bg-black/60'>
          {children}
        </div>,
        document.getElementById(selector)!
      )
    : null;
}
