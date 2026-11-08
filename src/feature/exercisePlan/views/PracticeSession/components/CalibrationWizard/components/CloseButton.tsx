import { X } from "lucide-react";

/** The wizard's close control — a real button, not a bare glyph. */
export const CloseButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
  >
    <X className="h-4 w-4" />
  </button>
);
