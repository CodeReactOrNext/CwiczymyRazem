import { cn } from "assets/lib/utils";
import { createPortal } from "react-dom";

// Modal wrapper component that ensures complete isolation
type ModalWrapperProps = {
  children: React.ReactNode;
  zIndex: string;
};

const ModalWrapper = ({ children, zIndex }: ModalWrapperProps) => {
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  if (!modalRoot) return null;

  // Add extra styles to ensure this modal completely blocks any other UI elements
  return createPortal(
    <div
      className={cn("fixed inset-0", zIndex, "overflow-hidden font-openSans")}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        backgroundColor: "black",
        willChange: "transform",
        isolation: "isolate",
      }}>
      {children}
    </div>,
    modalRoot
  );
};

export default ModalWrapper;
