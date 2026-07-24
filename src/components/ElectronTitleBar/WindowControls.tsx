import { cn } from "assets/lib/utils";
import { Minus, X } from "lucide-react";

// Empty square outline — window is not maximized yet.
const MaximizeIcon = () => (
  <svg
    width='10'
    height='10'
    viewBox='0 0 10 10'
    fill='none'
    aria-hidden='true'>
    <rect x='0.5' y='0.5' width='9' height='9' stroke='currentColor' />
  </svg>
);

// Two overlapping squares — the classic "restore down" glyph, no lucide equivalent.
const RestoreIcon = () => (
  <svg
    width='10'
    height='10'
    viewBox='0 0 10 10'
    fill='none'
    aria-hidden='true'>
    <path d='M2.5 1H9.5V8' stroke='currentColor' />
    <rect x='0.5' y='2.5' width='7' height='7' stroke='currentColor' />
  </svg>
);

const WindowButton = ({
  onClick,
  label,
  variant = "default",
  children,
}: {
  onClick: () => void;
  label: string;
  variant?: "default" | "close";
  children: React.ReactNode;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-label={label}
    className={cn(
      "flex h-full w-11 items-center justify-center text-zinc-400 transition-colors [-webkit-app-region:no-drag]",
      variant === "close"
        ? "hover:bg-red-500 hover:text-white"
        : "hover:bg-zinc-800 hover:text-zinc-100"
    )}>
    {children}
  </button>
);

interface WindowControlsProps {
  isMaximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * Minimize / maximize-restore / close buttons for the frameless Electron
 * window. Shared between the global fallback title bar
 * (components/ElectronTitleBar) and any page header that merges the window
 * chrome into its own layout (e.g. UserHeader) — relies on the parent flex
 * row to give it a definite height (`h-full` on each button).
 */
export const WindowControls = ({
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
  className,
}: WindowControlsProps) => (
  <div className={cn("flex items-stretch", className)}>
    <WindowButton label='Minimalizuj' onClick={onMinimize}>
      <Minus size={13} strokeWidth={1.5} />
    </WindowButton>
    <WindowButton
      label={isMaximized ? "Przywróć" : "Maksymalizuj"}
      onClick={onToggleMaximize}>
      {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
    </WindowButton>
    <WindowButton label='Zamknij' variant='close' onClick={onClose}>
      <X size={14} strokeWidth={1.5} />
    </WindowButton>
  </div>
);
