import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { useTonePresets } from "hooks/useTonePresets";
import { Power, RefreshCw, SlidersHorizontal, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
export const AmpSimButton = ({ compact = false, h = "h-12" }: AmpSimButtonProps) => {
  const amp = useAmpSim();
  const { devices, api, selectedId, loading, refresh, select } = useNativeAudioDevices();
  const { presets } = useTonePresets();
  const [open, setOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

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

  const onColor = amp.isOn ? "bg-red-950 text-red-400 hover:bg-red-900" : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700";

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        title='Amp simulator (ASIO, live)'
        className={cn(
          "flex items-center rounded-lg transition-all active:scale-95",
          compact ? "h-8 w-8 justify-center active:scale-90" : cn("gap-2 px-4", h),
          onColor
        )}>
        <Zap className={cn(compact ? "h-3 w-3" : "h-4 w-4 shrink-0", amp.isOn && "animate-pulse")} />
        {!compact && <span className='text-[10px] font-semibold tracking-wide'>{amp.isOn ? "AMP ON" : "AMP"}</span>}
      </button>

      {open && (
        <div className='absolute right-0 z-[9999] mt-2 w-72 rounded-lg bg-zinc-900/95 p-4 text-left text-white shadow-2xl backdrop-blur'>
          <div className='mb-3 flex items-center justify-between'>
            <span className='text-sm font-semibold'>Amplifier</span>
            <button
              type='button'
              onClick={() => amp.toggle()}
              disabled={amp.isBusy}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                amp.isOn ? "bg-red-600 text-white hover:bg-red-500" : "bg-zinc-700 text-white hover:bg-zinc-600"
              )}>
              <Power size={12} />
              {amp.isOn ? "Turn off" : "Turn on"}
            </button>
          </div>

          {/* ── Interface selection ───────────────────────────────── */}
          <div className='mb-3'>
            <div className='mb-1 flex items-center justify-between text-xs text-zinc-400'>
              <span>Interface {api ? `(${api})` : ""}</span>
              <button type='button' onClick={() => refresh()} title='Refresh list' className='text-zinc-400 hover:text-white'>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <select
              value={selectedId ?? ""}
              onChange={(e) => handleSelectDevice(Number(e.target.value))}
              className='w-full rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
              {devices.length === 0 && <option value=''>No input devices</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.inputChannels} in)
                </option>
              ))}
            </select>
          </div>

          {/* ── Preset selection ──────────────────────────────────── */}
          <div className='mb-3'>
            <span className='mb-1 block text-xs text-zinc-400'>Tone</span>
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
                </option>
              ))}
            </select>
          </div>

          {amp.error && <p className='mb-2 text-xs text-red-400'>{amp.error}</p>}
          {amp.overload && (
            <p className='mb-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-400'>
              DSP fell behind and reset (~{Math.round(amp.overload.driftMs)}ms) — you may have heard a click.
            </p>
          )}

          <div className='flex flex-col gap-1'>
            <div className='flex justify-between text-xs text-zinc-400'>
              <span>Level</span>
              <span>{Math.round(amp.params.level * 100)}</span>
            </div>
            <Slider
              value={[amp.params.level]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => amp.setParams({ level: v })}
            />
          </div>

          {amp.isOn && amp.info && (
            <p className='mt-3 text-[11px] text-zinc-400'>
              {amp.info.deviceName} · {amp.info.sampleRate / 1000}kHz · ~{amp.info.roundTripMs.toFixed(0)}ms latency
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
