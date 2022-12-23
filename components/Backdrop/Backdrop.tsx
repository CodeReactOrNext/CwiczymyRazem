import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface RatingPopUpProps {
  children: React.ReactElement;
  selector: string;
  onClick?: () => void;
}
const RatingPopUp = ({ children, selector, onClick }: RatingPopUpProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [selector]);

  return mounted
    ? createPortal(
        <div
          onClick={(event) => {
            const eventTarget = event.target as HTMLDivElement;
            if (eventTarget.id === "backdrop" && onClick) {
              onClick();
            }
          }}
          id='backdrop'
          className='fixed left-0 top-0 bottom-0 z-50 flex h-full w-full justify-center overflow-y-auto overflow-x-hidden bg-black/60'>
          {children}
        </div>,
        document.getElementById(selector)!
      )
    : null;
};

export default RatingPopUp;
