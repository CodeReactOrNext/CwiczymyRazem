import { cn } from "assets/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { MixerTrack } from "./TrackMixer";
import { TrackMixer } from "./TrackMixer";

interface MixerMenuProps {
  tracks: MixerTrack[];
  onChange: (id: string, next: { volume?: number; isMuted?: boolean }) => void;
  className?: string;
}

/**
 * The instrument levels, folded into the track header they belong to.
 *
 * The mixer used to own a whole row of the timeline, which cost more vertical
 * space than balancing a couple of instruments is worth — the lanes you are
 * actually reading got pushed down for a control touched once a session. As a
 * menu on the tablature header it is one click away and takes no room at all.
 *
 * Its own popover rather than the shared Radix menu: that one's roving focus
 * swallows the arrow keys the sliders inside need, so click-outside and Escape
 * are wired by hand. Escape stops there too — the screen closes on Escape, and
 * the first press should shut the menu, not the editor behind it.
 */
export function MixerMenu({ tracks, onChange, className }: MixerMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    // The timeline behind this owns the wheel and turns it into zoom, so a
    // wheel that started inside the menu has to stop here or scrolling a long
    // track list would zoom the editor instead.
    const stopWheel = (event: WheelEvent) => event.stopPropagation();

    const root = rootRef.current;
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    root?.addEventListener("wheel", stopWheel);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      root?.removeEventListener("wheel", stopWheel);
    };
  }, [open]);

  if (!tracks.length) return null;

  const mutedCount = tracks.filter((track) => track.isMuted).length;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type='button'
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label='Instrument levels'
        title='Instrument levels — what you hear'
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          open || mutedCount > 0
            ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
            : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100",
        )}>
        <SlidersHorizontal className='h-3.5 w-3.5' />
      </button>

      {open && (
        <div className='absolute left-0 top-full z-50 mt-2 w-80 rounded-lg bg-zinc-900 p-4'>
          <div className='mb-3 flex items-baseline gap-2'>
            <span className='text-sm font-semibold text-zinc-100'>Mix</span>
            <span className='text-xs text-zinc-400'>what you hear</span>
            {mutedCount > 0 && (
              <span className='ml-auto text-[11px] font-medium text-cyan-400'>
                {mutedCount} muted
              </span>
            )}
          </div>
          <TrackMixer
            tracks={tracks}
            onChange={onChange}
            className='max-h-64 grid-cols-1 overflow-y-auto pr-1'
          />
        </div>
      )}
    </div>
  );
}
