import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { Volume2, VolumeX } from "lucide-react";
import { GiDrumKit, GiGuitarBassHead, GiGuitarHead, GiMicrophone } from "react-icons/gi";

/** One instrument the Guitar Pro file plays, as the mixer needs it. */
export interface MixerTrack {
  id: string;
  /** A Guitar Pro track does not have to be named, so the mixer names it. */
  name?: string;
  trackType?: "guitar" | "bass" | "drums" | "vocals";
  volume: number;
  isMuted: boolean;
}

interface TrackMixerProps {
  tracks: MixerTrack[];
  /** Applies one change to one track; the caller owns the state. */
  onChange: (id: string, next: { volume?: number; isMuted?: boolean }) => void;
  className?: string;
}

const ICONS = {
  guitar: GiGuitarHead,
  bass: GiGuitarBassHead,
  drums: GiDrumKit,
  vocals: GiMicrophone,
} as const;

/** Each instrument keeps the colour its lane and its notes already use. */
const ACCENTS = {
  guitar: "text-cyan-400",
  bass: "text-emerald-400",
  drums: "text-purple-400",
  vocals: "text-amber-400",
} as const;

/**
 * Instrument levels for the Guitar Pro playback, shown from the tablature
 * header on the alignment screen.
 *
 * Lining a tab up against a recording is done by ear as much as by eye, and the
 * ear needs one thing at a time: the kit against the recording's transients,
 * then the riff against the guitar. Both were reachable before only through the
 * volume dropdown in the session toolbar, which the alignment screen covers —
 * so the moment the work needed the mixer, the mixer was gone.
 *
 * Mute is per instrument and volume is a plain level. Nothing here touches the
 * recording's own track: that one has its own control in the transport, and
 * keeping the two separate is what makes "quieter" an unambiguous instruction.
 */
export function TrackMixer({ tracks, onChange, className }: TrackMixerProps) {
  if (!tracks.length) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] items-center gap-x-6 gap-y-3",
        className,
      )}>
      {tracks.map((track) => {
        const type = track.trackType ?? "guitar";
        const Icon = ICONS[type] ?? GiGuitarHead;
        const percent = Math.round(track.volume * 100);
        const label = track.id === "main" ? "Main instrument" : track.name || "Instrument";

        return (
          <div key={track.id} className='flex min-w-0 items-center gap-2.5'>
            <button
              type='button'
              onClick={() => onChange(track.id, { isMuted: !track.isMuted })}
              title={track.isMuted ? `Unmute ${label}` : `Mute ${label}`}
              aria-pressed={track.isMuted}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                track.isMuted
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-zinc-800 text-zinc-400 hover:text-white",
              )}>
              {track.isMuted ? (
                <VolumeX className='h-3.5 w-3.5' strokeWidth={2.5} />
              ) : (
                <Volume2 className='h-3.5 w-3.5' strokeWidth={2.5} />
              )}
            </button>

            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1.5'>
                <Icon className={cn("h-3 w-3 shrink-0", track.isMuted ? "text-zinc-600" : ACCENTS[type])} />
                <span
                  className={cn(
                    "truncate text-[11px] font-semibold",
                    track.isMuted ? "text-zinc-600" : "text-zinc-300",
                  )}>
                  {label}
                </span>
                <span className='ml-auto shrink-0 font-mono text-[10px] tabular-nums text-zinc-500'>
                  {track.isMuted ? "muted" : `${percent}%`}
                </span>
              </div>
              <Slider
                value={[track.isMuted ? 0 : percent]}
                max={100}
                step={1}
                aria-label={`${label} volume`}
                className='mt-1.5 cursor-pointer'
                // Dragging to zero is how a mute is asked for; dragging back up is
                // how it is taken back, so the two controls never disagree.
                onValueChange={([value]) =>
                  onChange(track.id, { volume: value / 100, isMuted: value === 0 })
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
