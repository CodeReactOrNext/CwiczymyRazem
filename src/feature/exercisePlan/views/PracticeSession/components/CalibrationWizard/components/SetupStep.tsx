import { Button } from "assets/components/ui/button";
import { Slider } from "assets/components/ui/slider";
import { cn } from "assets/lib/utils";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { useNativeOutputDevice } from "hooks/useNativeOutputDevice";
import { ChevronLeft, RefreshCw, Speaker } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { FaChevronRight, FaHeadphones, FaMicrophone, FaPlug, FaTimes, FaVolumeOff } from "react-icons/fa";

import type { InputSource } from "./SourceStep";

interface SetupStepProps {
  isListening:       boolean;
  isLoading:         boolean;
  inputSource:       InputSource;
  audioRefs:         AudioRefs;
  inputGain:         number;
  onInputGainChange: (v: number) => void;
  isNative:          boolean;
  onSelectDevice?:   (deviceId: number) => Promise<void>;
  onGrant:           () => void;
  onNext:            () => void;
  onBack:            () => void;
  onCancel:          () => void;
}

export const SetupStep = React.memo(function SetupStep({
  isListening, isLoading, inputSource, audioRefs, inputGain, onInputGainChange,
  isNative, onSelectDevice, onGrant, onNext, onBack, onCancel,
}: SetupStepProps) {
  const [volume, setVolume] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!isListening) {
      setVolume(0);
      return;
    }

    const tick = () => {
      const currentVol = audioRefs.volumeRef.current;
      setVolume(currentVol);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, audioRefs]);

  const fillPct    = Math.min(100, volume * 300);
  const tooQuiet   = fillPct < 8;
  const signalGood = isListening && !tooQuiet;



  return (
    <div className="flex h-full flex-col px-5 py-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="rounded-full p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-bold tracking-tight">
            {isNative ? "Audio Setup" : inputSource === "interface" ? "Audio Interface Setup" : "Microphone Setup"}
          </h2>
        </div>
        <button onClick={onCancel} className="rounded-full p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 w-full overflow-y-auto">
      


        {/* Source-specific tips — always visible */}
        {isNative ? (
          <NativeInterfaceSelector isListening={isListening} onSelectDevice={onSelectDevice} />
        ) : inputSource === "microphone" ? (
          <MicrophoneTips />
        ) : (
          <InterfaceTips />
        )}

        {/* Grant access — only when mic not yet active. Native interface capture
            needs no OS permission, so the copy differs from the browser mic path. */}
        {!isListening && (
          <Button
            onClick={onGrant}
            disabled={isLoading}
            className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold h-11"
          >
            {isNative ? (
              <FaPlug className="mr-2 h-4 w-4" />
            ) : (
              <FaMicrophone className="mr-2 h-4 w-4" />
            )}
            {isLoading
              ? "Connecting…"
              : isNative
                ? "Start Listening"
                : "Grant Microphone Access"}
          </Button>
        )}

        {/* Signal + gain — shown after mic grant */}
        {isListening && (
          <>
            <div className="rounded-lg bg-zinc-900/70 p-4 space-y-4">
              {/* Signal meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaMicrophone className={cn("h-3 w-3 transition-colors", signalGood ? "text-emerald-400 animate-pulse" : "text-zinc-500")} />
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500">Signal Level</span>
                  </div>
                  <span className={cn("text-[10px] font-bold transition-colors",
                    tooQuiet ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {tooQuiet ? "Too quiet — strum a string" : "Good level ✓"}
                  </span>
                </div>
                <div className="relative h-5 rounded-lg bg-zinc-800 overflow-hidden">
                  <div className="absolute inset-y-0 left-[8%] w-px bg-white/10" />
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-75",
                      tooQuiet ? "bg-amber-500" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    )}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>

              {/* Gain slider — manual only */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500">Input Sensitivity</span>
                  <span className="text-xs font-mono text-zinc-400">{inputGain.toFixed(1)}×</span>
                </div>
                <Slider
                  min={0.5} max={10} step={0.1}
                  value={[inputGain]}
                  onValueChange={([v]) => onInputGainChange(v)}
                />

              </div>
            </div>



            <Button
              onClick={onNext}
              className="w-full h-12 mt-4"
            >
              Tune Guitar <FaChevronRight className="ml-1.5 h-3 w-3" />
            </Button>
          </>
        )}

        <button onClick={onCancel} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors text-center py-1">
          Skip calibration
        </button>
      </div>
    </div>
  );
});

function MicrophoneTips() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-amber-500/10 p-4 flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <FaHeadphones className="text-lg text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-300 mb-1">Use wired headphones</p>
          <p className="text-xs text-amber-200/60 leading-relaxed">
            Without headphones the mic picks up the backing track through your speakers and causes false detections.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-500/10 p-4 flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <FaVolumeOff className="text-lg text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-300 mb-1">Find a quiet spot</p>
          <p className="text-xs text-amber-200/60 leading-relaxed">
            Background noise causes false note detections. Close doors and turn off any music.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Electron-only: pick which ASIO/WASAPI interface feeds pitch detection.
 * Shares its persisted device id with the amp simulator (useNativeAudioDevices),
 * so a choice made here or in the amp panel applies everywhere.
 */
function NativeInterfaceSelector({
  isListening, onSelectDevice,
}: {
  isListening: boolean;
  onSelectDevice?: (deviceId: number) => Promise<void>;
}) {
  const { devices, api, selectedId, loading, refresh, select } = useNativeAudioDevices();
  const output = useNativeOutputDevice(devices.find((d) => d.id === selectedId)?.name);
  const [outputExpanded, setOutputExpanded] = useState(false);

  const handleSelect = async (id: number) => {
    select(id);
    if (isListening) await onSelectDevice?.(id); // live stream → restart on the new device
  };

  const selectedOutput = output.devices.find((d) => d.deviceId === output.selectedId);
  const showOutputPicker = outputExpanded || !output.selectedId;

  return (
    <div className="rounded-lg bg-zinc-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaPlug className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-bold tracking-widest text-zinc-500">
            Interface{api ? ` · ${api}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          title="Refresh device list"
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </button>
      </div>

      <select
        value={selectedId ?? ""}
        onChange={(e) => handleSelect(Number(e.target.value))}
        className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      >
        {devices.length === 0 && <option value="">No input devices found</option>}
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.inputChannels} in)
          </option>
        ))}
      </select>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Native low-latency capture — bypasses the browser entirely. Plug your guitar straight into the interface above.
      </p>

      {/* ── Output routing — ASIO is exclusive, so app audio (metronome, backing
          tracks) must share this same device or capture gets glitchy/cut off. ── */}
      {!showOutputPicker ? (
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <Speaker className="h-3 w-3 shrink-0 text-zinc-500" />
            <span className="text-[11px] text-zinc-500 truncate">
              Output: {selectedOutput?.label || "matched"} (auto)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOutputExpanded(true)}
            className="shrink-0 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <Speaker className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-500">Output</span>
          </div>
          <select
            value={output.selectedId ?? ""}
            onChange={(e) => output.select(e.target.value)}
            className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            {output.devices.length === 0 && <option value="">No output devices found</option>}
            {output.devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || d.deviceId}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Should match the interface above so audio and capture use the same device.
          </p>
        </div>
      )}
    </div>
  );
}

function InterfaceTips() {
  return (
    <div className="rounded-lg bg-zinc-900/70 p-4 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
        <FaPlug className="text-lg text-zinc-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-200 mb-1">Before you start</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Make sure your interface is selected as the browser's microphone input and your guitar is plugged in.
          You'll set the gain level on the next screen.
        </p>
      </div>
    </div>
  );
}
