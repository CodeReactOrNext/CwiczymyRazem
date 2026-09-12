import { cn } from "assets/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import type { AmpDiagnostics, AmpStreamInfo } from "types/nativeAudio";

interface StatusBarProps {
  isOn: boolean;
  info: AmpStreamInfo | null;
  diagnostics: AmpDiagnostics | null;
  bufferSize: number;
  api: string | null;
  /** Falls back to this when the stream isn't running and `info` is null. */
  selectedDeviceName?: string;
  /** Opens the I/O sheet. The strip already names the interface, so the name
   *  itself is the most findable way in — you click the thing you want to
   *  change rather than hunting for a gear. */
  onOpenSettings?: () => void;
}

const Cell = ({
  label,
  value,
  title,
  tone,
}: {
  label: string;
  value: string;
  title?: string;
  tone?: "warn";
}) => (
  <span className='flex items-baseline gap-1.5' title={title}>
    <span className='text-[10px] text-zinc-600'>{label}</span>
    <span
      className={cn(
        "font-mono text-[11px] tabular-nums",
        tone === "warn" ? "text-amber-400" : "text-zinc-400",
      )}>
      {value}
    </span>
  </span>
);

/**
 * The strip along the bottom edge of the window, where a plugin keeps the
 * numbers you glance at rather than read: what's running, how fast, and
 * whether the engine is keeping up. Dropouts and DSP load turn amber on their
 * own, so a struggling chain is visible without opening anything.
 */
export const StatusBar = ({
  isOn,
  info,
  diagnostics,
  bufferSize,
  api,
  selectedDeviceName,
  onOpenSettings,
}: StatusBarProps) => {
  const hasDevice = !!(info?.deviceName ?? selectedDeviceName);
  const deviceName = info?.deviceName ?? selectedDeviceName ?? "No device";
  const routedOut =
    info?.outDeviceName && info.outDeviceName !== info.deviceName
      ? info.outDeviceName
      : null;
  const dspLoad =
    diagnostics && diagnostics.sampleRate > 0
      ? Math.round(
          (diagnostics.dspAvgMs /
            ((diagnostics.frameSize / diagnostics.sampleRate) * 1000)) *
            100,
        )
      : null;

  return (
    <div className='flex flex-wrap items-center justify-between gap-x-5 gap-y-2 px-4 py-2.5'>
      <button
        type='button'
        onClick={onOpenSettings}
        disabled={!onOpenSettings}
        title='Choose the audio interface, channels and buffer size'
        className='group -mx-2 flex min-w-0 items-center gap-2 rounded px-2 py-1 transition-colors enabled:hover:bg-zinc-800/60'>
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isOn ? "bg-emerald-400" : "bg-zinc-700",
          )}
        />
        {hasDevice ? (
          <>
            <span className='truncate text-[11px] text-zinc-400 group-enabled:group-hover:text-zinc-200'>
              {deviceName}
              {routedOut && (
                <span className='text-zinc-600'> → {routedOut}</span>
              )}
            </span>
            {api && (
              <span className='font-mono shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400'>
                {api}
              </span>
            )}
          </>
        ) : (
          // Nothing picked yet: the strip stops reporting and starts asking.
          <span className='truncate text-[11px] text-amber-400'>
            Choose an audio interface
          </span>
        )}
        {onOpenSettings && (
          <SlidersHorizontal
            size={11}
            className='shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300'
          />
        )}
      </button>

      <span className='flex flex-wrap items-center gap-x-4 gap-y-1'>
        <Cell
          label='Rate'
          value={info ? `${info.sampleRate / 1000}kHz` : "—"}
        />
        <Cell
          label='Buffer'
          value={`${bufferSize}`}
          title='Frames per audio callback — smaller is tighter but more fragile'
        />
        <Cell
          label='Latency'
          value={info ? `${info.roundTripMs.toFixed(0)}ms` : "—"}
        />
        {diagnostics && (
          <Cell
            label='Dropouts'
            value={
              diagnostics.drops > 0
                ? `${diagnostics.underruns} (${diagnostics.drops} dropped)`
                : `${diagnostics.underruns}`
            }
            tone={diagnostics.underruns > 0 ? "warn" : undefined}
            title='Hardware callbacks that found nothing to play since the stream opened — each one was an audible gap. Dropped blocks are the engine shedding backlog to keep latency from creeping up.'
          />
        )}
        {dspLoad !== null && (
          <Cell
            label='DSP'
            value={`${dspLoad}%`}
            tone={dspLoad > 70 ? "warn" : undefined}
            title='Share of each audio block spent inside the chain'
          />
        )}
      </span>
    </div>
  );
};
