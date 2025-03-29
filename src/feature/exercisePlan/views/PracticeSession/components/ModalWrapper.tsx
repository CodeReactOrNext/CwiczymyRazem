import { cn } from "assets/lib/utils";
import { createPortal } from "react-dom";

type ModalWrapperProps = {
  children: React.ReactNode;
  zIndex: string;
};

export const ModalWrapper = ({ children, zIndex }: ModalWrapperProps) => {
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  if (!modalRoot) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 overflow-hidden font-openSans",
        "h-dvh w-screen bg-black",
        "isolate will-change-transform",
        zIndex
      )}>
      {children}
    </div>,
    modalRoot
  );
};
