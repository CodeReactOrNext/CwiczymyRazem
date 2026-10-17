import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import {
  isExclusiveAsioWrapper,
  onOutputStalled,
  useNativeOutputDevice,
} from "hooks/useNativeOutputDevice";
import { useTranslation } from "hooks/useTranslation";
import { Speaker, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function OutputStalledCard({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("calibration");
  const { devices, selectedId } = useNativeAudioDevices();
  // No input name on purpose: the fuzzy match would pick the very interface
  // that is locked right now.
  const output = useNativeOutputDevice();
  const inputName = devices.find((d) => d.id === selectedId)?.name;

  const handleSelect = (deviceId: string) => {
    output.select(deviceId);
    // If this output is locked too, the watchdog raises the notice again.
    onClose();
  };

  return (
    <div
      role='alert'
      className='fixed bottom-4 left-1/2 z-[999999999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 space-y-3 rounded-lg bg-zinc-900 p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <Speaker className='h-4 w-4 shrink-0 text-amber-400' />
          <span className='text-sm font-semibold text-white'>
            {t("output_stall.title")}
          </span>
        </div>
        <button
          type='button'
          onClick={onClose}
          title={t("output_stall.close")}
          className='text-zinc-500 transition-colors hover:text-white'>
          <X className='h-4 w-4' />
        </button>
      </div>

      <p className='text-xs leading-relaxed text-zinc-400'>
        {t("output_stall.body")}
      </p>

      <select
        value=''
        onChange={(e) => handleSelect(e.target.value)}
        className='w-full rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50'>
        <option value='' disabled>
          {output.devices.length === 0
            ? t("setup.no_outputs")
            : t("output_stall.pick")}
        </option>
        {output.devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || d.deviceId}
          </option>
        ))}
      </select>

      {isExclusiveAsioWrapper(inputName) && (
        <p className='text-xs leading-relaxed text-zinc-500'>
          {t("output_stall.asio4all")}
        </p>
      )}
    </div>
  );
}

/**
 * Desktop-only: shown once the metronome has given up on its output (see
 * armClockWatchdog in useMetronome). An exclusive ASIO driver holding the
 * interface leaves the app's own playback with nowhere to go, and the only fix
 * is an output the driver isn't holding — so the picker lives right here
 * instead of behind the calibration wizard.
 */
export function OutputStalledNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => onOutputStalled(() => setOpen(true)), []);

  if (!open || typeof window === "undefined" || !window.nativeAudio)
    return null;
  return createPortal(
    <OutputStalledCard onClose={() => setOpen(false)} />,
    document.body,
  );
}
