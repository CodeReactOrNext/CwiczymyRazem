import { cn } from "assets/lib/utils";
import { Knob } from "feature/toneStudio/components/Knob";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { RippleButton } from "hooks/useRipple";
import { useTonePresets } from "hooks/useTonePresets";
import { Power, RefreshCw, SlidersHorizontal, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface AmpSimButtonProps {
  /** Icon-only trigger to match the compact toolbar layout. */
  compact?: boolean;
  /** Height class to align with sibling toolbar buttons (e.g. "h-12" / "h-8"). */
  h?: string;
}

/**
 * Electron-only amp simulator control. Renders nothing on the web build
 * (window.nativeAmp is absent). Toggles real-time monitoring, lets the user pick
 * which audio interface + saved tone preset to use, plus a basic level control.
 * Deep tone-shaping (drive/EQ/delay/IR) lives on the /tone-studio page.
 */
export const AmpSimButton = ({
  compact = false,
  h = "h-12",
}: AmpSimButtonProps) => {
  const amp = useAmpSim();
  const { devices, api, selectedId, loading, refresh, select } =
    useNativeAudioDevices();
  const { presets } = useTonePresets();
  const [open, setOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Custom popover (not the shared Radix DropdownMenu — its roving-focus/typeahead
  // handling fights with the <select> inputs inside), so click-outside/Escape need
  // to be wired up by hand.
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!amp.available) return null;

  const handleSelectDevice = async (id: number) => {
    select(id);
    await amp.restart(); // re-open on the new interface if currently running
  };

  const handleSelectPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setActivePresetId(id);
    amp.setParams(preset.params);
  };

  // Cyan matches this toolbar's own "engaged" convention (Pitch Detect = emerald,
  // Tuner = violet, each on a -950/-400 pair) — red would read as an error state.
  const onColor = amp.isOn
    ? "bg-cyan-950 text-cyan-400 hover:bg-cyan-900"
    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700";

  return (
    <div className='relative' ref={rootRef}>
      <RippleButton
        onClick={() => setOpen((o) => !o)}
        title='Amp simulator (ASIO, live)'
        className={cn(
          "flex items-center rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/50 active:scale-95",
          compact
            ? "h-8 w-8 justify-center active:scale-90"
            : cn("gap-2 px-4", h),
          onColor,
        )}>
        <Zap
          className={cn(
            compact ? "h-3 w-3" : "h-4 w-4 shrink-0",
            amp.isOn && "animate-pulse",
          )}
        />
        {!compact && (
          <span className='text-[10px] font-semibold tracking-wide'>
            {amp.isOn ? "AMP ON" : "AMP"}
          </span>
        )}
      </RippleButton>

      {open && (
        <div className='absolute right-0 z-[99999999] mt-2 w-72 rounded-lg border border-white/10 bg-zinc-900/95 p-4 text-left text-white backdrop-blur-md'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <Zap size={13} className='text-cyan-400' />
              Amplifier
            </span>
            <RippleButton
              onClick={() => amp.toggle()}
              disabled={amp.isBusy}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                amp.isOn
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-zinc-700 text-white hover:bg-zinc-600",
              )}>
              <Power size={12} />
              {amp.isOn ? "Turn off" : "Turn on"}
            </RippleButton>
          </div>

          {/* ── Interface selection ───────────────────────────────── */}
          <div className='mb-3'>
            <div className='mb-1 flex items-center justify-between text-xs text-zinc-400'>
              <span>Interface {api ? `(${api})` : ""}</span>
              <RippleButton
                onClick={() => refresh()}
                title='Refresh list'
                className='rounded p-0.5 text-zinc-400 hover:text-white'>
                <RefreshCw
                  size={12}
                  className={loading ? "animate-spin" : ""}
                />
              </RippleButton>
            </div>
            <select
              value={selectedId ?? ""}
              onChange={(e) => handleSelectDevice(Number(e.target.value))}
              className='w-full rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
              {devices.length === 0 && (
                <option value=''>No input devices</option>
              )}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.inputChannels} in)
                </option>
              ))}
            </select>
          </div>

          {/* ── Preset selection ──────────────────────────────────── */}
          <div className='mb-4'>
            <span className='mb-1 block text-xs text-zinc-400'>Preset</span>
            <select
              value={activePresetId ?? ""}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className='w-full rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
              <option value='' disabled>
                Select preset…
              </option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.builtIn ? " (Built-in)" : ""}
                </option>
              ))}
            </select>
          </div>

          {amp.error && (
            <p className='mb-2 text-xs text-red-400'>{amp.error}</p>
          )}
          {amp.overload && (
            <p className='mb-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-400'>
              DSP fell behind and reset (~{Math.round(amp.overload.driftMs)}ms)
              — you may have heard a click.
            </p>
          )}
          {amp.connectionIssue && (amp.connectionIssue.status === "lost" || amp.connectionIssue.status === "retrying") && (
            <p className='mb-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-400'>
              Audio interface disconnected — reconnecting…
            </p>
          )}
          {amp.connectionIssue?.status === "recovered" && (
            <p className='mb-2 rounded-lg bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-400'>
              Audio interface reconnected.
            </p>
          )}

          <div className='flex justify-center'>
            <Knob
              label='Level'
              value={amp.params.level}
              size={56}
              accent='cyan'
              onChange={(v) => amp.setParams({ level: v })}
            />
          </div>

          {amp.isOn && amp.info && (
            <p className='mt-3 text-center text-[11px] text-zinc-500'>
              {amp.info.deviceName} · {amp.info.sampleRate / 1000}kHz · ~
              {amp.info.roundTripMs.toFixed(0)}ms latency
            </p>
          )}

          <Link
            href='/tone-studio'
            className='mt-3 flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800'>
            <SlidersHorizontal size={12} />
            Open Tone Studio
          </Link>
        </div>
      )}
    </div>
  );
};
