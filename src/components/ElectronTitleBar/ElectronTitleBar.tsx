import { cn } from "assets/lib/utils";
import { Minus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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
      "flex h-9 w-11 items-center justify-center text-zinc-400 transition-colors [-webkit-app-region:no-drag]",
      variant === "close"
        ? "hover:bg-red-500 hover:text-white"
        : "hover:bg-zinc-800 hover:text-zinc-100",
    )}>
    {children}
  </button>
);

interface DesktopState {
  isElectron: boolean;
  isMac: boolean;
  isMaximized: boolean;
}

const initialDesktopState: DesktopState = {
  isElectron: false,
  isMac: false,
  isMaximized: false,
};

/**
 * Custom title bar for the Electron desktop shell. The main process creates a
 * frameless BrowserWindow (see electron/main.js); this replaces the OS chrome
 * so the window looks native to *our* design instead of the system default.
 * Renders nothing on the web build — `window.electronWindow` is only present
 * inside Electron (injected by electron/preload.js).
 */
export const ElectronTitleBar = () => {
  const [{ isElectron, isMac, isMaximized }, setDesktopState] =
    useState(initialDesktopState);

  useEffect(() => {
    const api = window.electronWindow;
    if (!api) return undefined;

    // Both the initial reveal and later updates flow through async callbacks
    // (IPC round-trips), never a direct synchronous setState in the effect body.
    let cancelled = false;
    api.isMaximized().then((maximized) => {
      if (cancelled) return;
      setDesktopState({
        isElectron: true,
        isMac: api.platform === "darwin",
        isMaximized: maximized,
      });
    });

    const unsubscribe = api.onMaximizedChange((maximized) =>
      setDesktopState((s) => ({ ...s, isMaximized: maximized })),
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!isElectron) return null;

  const api = window.electronWindow;
  if (!api) return null;

  return (
    <div
      className='sticky top-0 z-50 flex h-9 w-full shrink-0 select-none items-center justify-between bg-zinc-950 [-webkit-app-region:drag]'
      onDoubleClick={() => api.toggleMaximize()}>
      <div className={cn("flex items-center gap-2 px-3", isMac && "pl-20")}>
        <Image
          src='/images/logolight.svg'
          alt=''
          width={14}
          height={14}
          className='h-3.5 w-3.5 opacity-80'
        />
        <span className='text-[11px] font-bold tracking-wide text-zinc-400'>
          riff<span className='text-cyan-500'>.</span>quest
        </span>
      </div>

      {!isMac && (
        <div className='flex h-full items-stretch'>
          <WindowButton label='Minimalizuj' onClick={() => api.minimize()}>
            <Minus size={13} strokeWidth={1.5} />
          </WindowButton>
          <WindowButton
            label={isMaximized ? "Przywróć" : "Maksymalizuj"}
            onClick={() => api.toggleMaximize()}>
            {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
          </WindowButton>
          <WindowButton
            label='Zamknij'
            variant='close'
            onClick={() => api.close()}>
            <X size={14} strokeWidth={1.5} />
          </WindowButton>
        </div>
      )}
    </div>
  );
};
