import { MdScreenRotation } from "react-icons/md";

/**
 * Portrait-only chip suggesting the user rotate the phone — the landscape
 * session view fits much more of the tab on screen. Tapping tries to switch
 * automatically (fullscreen + orientation lock, supported on Android Chrome);
 * where the API is unavailable (e.g. iOS Safari) it stays a visual hint and
 * the user rotates manually.
 */
export const RotateDeviceHint = () => {
  const handleClick = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
      await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.("landscape");
    } catch {
      // Orientation lock unsupported/denied — manual rotation still works.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mx-auto flex items-center gap-3 rounded-lg bg-cyan-500/10 px-4 py-2.5 text-left transition-colors hover:bg-cyan-500/15 active:scale-95"
    >
      <MdScreenRotation className="h-5 w-5 shrink-0 text-cyan-400" />
      <span className="flex flex-col gap-0.5 leading-tight">
        <span className="text-xs font-bold text-cyan-300">Rotate your phone</span>
        <span className="text-[11px] font-medium text-zinc-400">Wider tab, bigger controls</span>
      </span>
    </button>
  );
};
