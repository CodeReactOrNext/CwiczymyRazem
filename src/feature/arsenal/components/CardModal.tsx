import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface CardModalProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Centered, tap-to-dismiss modal holding one item card. Touch devices get this
 * wherever a pointer would get a hover tooltip — hover events never fire there,
 * and the card is the only place an item's stats are written down.
 */
export const CardModal = ({ onClose, children }: CardModalProps) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}>
      <div
        className='relative w-full max-w-[320px]'
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label='Close'
          className='absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300 shadow-lg hover:text-white'>
          <X size={15} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
};
