import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

interface RatingPopUpProps {
  children: React.ReactElement;
  selector: string;
  onClick?: () => void;
}
const Backdrop = ({ children, selector, onClick }: RatingPopUpProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [selector]);

  return mounted
    ? createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.3 } }}
          onClick={(event) => {
            const eventTarget = event.target as HTMLDivElement;
            if (eventTarget.id === "backdrop" && onClick) {
              onClick();
            }
          }}
          id='backdrop'
          className='fixed  flex justify-center items-center left-0 top-0 bottom-0 z-50  h-full w-full  overflow-y-auto overflow-x-hidden bg-black/60 font-sans'>
          {children}
        </motion.div>,
        document.getElementById(selector)!
      )
    : null;
};

export default Backdrop;
