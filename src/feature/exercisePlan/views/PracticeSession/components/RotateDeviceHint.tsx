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
      onClick={handleClick}
      className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 px-4 py-2 text-[10px] font-semibold tracking-wide text-zinc-400 transition-all hover:text-zinc-200 active:scale-95"
    >
      <MdScreenRotation className="h-4 w-4 text-cyan-400/80" />
      Rotate your phone for a wider view
    </button>
  );
};
