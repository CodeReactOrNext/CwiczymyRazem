import { cn } from "assets/lib/utils";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { ChevronLeft, ChevronRight, House } from "lucide-react";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";

import { WindowControls } from "./WindowControls";

const NavButton = ({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-label={label}
    className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-zinc-300 transition-colors [-webkit-app-region:no-drag] hover:bg-zinc-800 hover:text-zinc-100'>
    {children}
  </button>
);

/**
 * Persistent, app-wide title bar for the Electron desktop shell — back /
 * forward / home navigation on the left, minimize/maximize/close on the
 * right (Spotify-desktop-style single strip). Mounted once, globally, in
 * _app.tsx; the app's own content reserves `pt-10` for it there so nothing
 * renders underneath.
 *
 * Portalled straight into `document.body` rather than rendered in place:
 * `position: fixed` only anchors to the viewport as long as no ancestor sets
 * a `transform`/`filter`/`perspective`/`will-change` — any one of those
 * (present somewhere in a React tree this size, e.g. framer-motion wrappers
 * or backdrop-blur containers) would silently turn it into a scroll-along
 * `absolute` instead. Rendering as a direct child of `<body>` sidesteps that
 * whole class of bug. The bar's z-index is likewise set to the CSS max so it
 * stays above even the most aggressive in-app overlays (practice session
 * views go up to `z-[999999999]`).
 *
 * On mac the OS draws real traffic lights (`titleBarStyle: "hidden"` +
 * `trafficLightPosition` in electron/main.js) independent of any web
 * content, so the bar still renders (for the nav buttons) but leaves room on
 * the left instead of drawing its own window controls. Renders nothing on
 * the web build — `window.electronWindow` is only present inside Electron
 * (injected by electron/preload.js).
 */
export const ElectronTitleBar = () => {
  const router = useRouter();
  const { isElectron, isMac, isMaximized, minimize, toggleMaximize, close } =
    useElectronWindowControls();

  if (!isElectron || typeof document === "undefined") return null;

  return createPortal(
    <div
      className='fixed left-0 right-0 top-0 z-[2147483647] flex h-10 select-none items-center justify-between bg-zinc-950 [-webkit-app-region:drag]'
      onDoubleClick={toggleMaximize}>
      <div className={cn("flex items-center gap-1.5 px-3", isMac && "pl-20")}>
        <NavButton label='Wstecz' onClick={() => router.back()}>
          <ChevronLeft size={16} strokeWidth={2} />
        </NavButton>
        <NavButton label='Dalej' onClick={() => window.history.forward()}>
          <ChevronRight size={16} strokeWidth={2} />
        </NavButton>
        <NavButton label='Panel główny' onClick={() => router.push("/dashboard")}>
          <House size={14} strokeWidth={2} />
        </NavButton>
      </div>

      {!isMac && (
        <WindowControls
          isMaximized={isMaximized}
          onMinimize={minimize}
          onToggleMaximize={toggleMaximize}
          onClose={close}
          className='h-10'
        />
      )}
    </div>,
    document.body
  );
};
