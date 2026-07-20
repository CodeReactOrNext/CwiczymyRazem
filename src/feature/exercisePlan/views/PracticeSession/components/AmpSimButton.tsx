import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import { useAmpSim } from "hooks/useAmpSim";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { Power, RefreshCw, Speaker, Zap } from "lucide-react";
import { useState } from "react";

interface AmpSimButtonProps {
  /** Icon-only trigger to match the compact toolbar layout. */
  compact?: boolean;
  /** Height class to align with sibling toolbar buttons (e.g. "h-12" / "h-8"). */
  h?: string;
}

/**
 * Electron-only amp simulator control. Renders nothing on the web build
 * (window.nativeAmp is absent). Toggles real-time monitoring with a tube-style
 * effect chain running natively over ASIO/WASAPI, and lets the user pick which
 * audio interface to use. Styled to sit inline next to the Recalibrate button.
 */
export const AmpSimButton = ({ compact = false, h = "h-12" }: AmpSimButtonProps) => {
  const amp = useAmpSim();
  const { devices, api, selectedId, loading, refresh, select } = useNativeAudioDevices();
  const [open, setOpen] = useState(false);

  if (!amp.available) return null;

  const handleSelectDevice = async (id: number) => {
    select(id);
    await amp.restart(); // re-open on the new interface if currently running
  };

  const knob = (label: string, key: "drive" | "tone" | "level") => (
    <div className='flex flex-col gap-1'>
      <div className='flex justify-between text-xs text-zinc-400'>
        <span>{label}</span>
        <span>{Math.round(amp.params[key] * 100)}</span>
      </div>
      <Slider
        value={[amp.params[key]]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={([v]) => amp.setParams({ [key]: v })}
      />
    </div>
  );

  const onColor = amp.isOn ? "bg-red-950 text-red-400 hover:bg-red-900" : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700";

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        title='Symulator wzmacniacza (ASIO, na żywo)'
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
            <span className='text-sm font-semibold'>Wzmacniacz</span>
            <button
              type='button'
              onClick={() => amp.toggle()}
              disabled={amp.isBusy}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                amp.isOn ? "bg-red-600 text-white hover:bg-red-500" : "bg-zinc-700 text-white hover:bg-zinc-600"
              )}>
              <Power size={12} />
              {amp.isOn ? "Wyłącz" : "Włącz"}
            </button>
          </div>

          {/* ── Interface selection ───────────────────────────────── */}
          <div className='mb-3'>
            <div className='mb-1 flex items-center justify-between text-xs text-zinc-400'>
              <span>Interfejs {api ? `(${api})` : ""}</span>
              <button type='button' onClick={() => refresh()} title='Odśwież listę' className='text-zinc-400 hover:text-white'>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <select
              value={selectedId ?? ""}
              onChange={(e) => handleSelectDevice(Number(e.target.value))}
              className='w-full rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
              {devices.length === 0 && <option value=''>Brak urządzeń wejściowych</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.inputChannels} in)
                </option>
              ))}
            </select>
          </div>

          {amp.error && <p className='mb-2 text-xs text-red-400'>{amp.error}</p>}

          <div className='flex flex-col gap-3'>
            {knob("Drive", "drive")}
            {knob("Tone", "tone")}
            {knob("Level", "level")}

            <button
              type='button'
              onClick={() => amp.setParams({ cab: !amp.params.cab })}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                amp.params.cab ? "bg-red-500/10 text-red-400" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
              )}>
              <Speaker size={12} />
              Kolumna (cab) {amp.params.cab ? "ON" : "OFF"}
            </button>
          </div>

          {amp.isOn && amp.info && (
            <p className='mt-3 text-[11px] text-zinc-400'>
              {amp.info.deviceName} · {amp.info.sampleRate / 1000}kHz · ~{amp.info.roundTripMs.toFixed(0)}ms latency
            </p>
          )}
        </div>
      )}
    </div>
  );
};
