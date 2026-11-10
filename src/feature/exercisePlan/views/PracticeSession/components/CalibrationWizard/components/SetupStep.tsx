import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { AudioSelect } from "feature/toneStudio/components/AudioSelect";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useNativeAudioDevices } from "hooks/useNativeAudioDevices";
import { isExclusiveAsioWrapper, useNativeOutputDevice } from "hooks/useNativeOutputDevice";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { useInputLevel } from "../hooks/useInputLevel";
import type { LevelStatus } from "../inputLevel";
import { CloseButton } from "./CloseButton";
import { ReadyCheck } from "./ReadyCheck";
import type { InputSource } from "./SourceStep";


/** This screen only asks "is the guitar coming in?" — how loud is the sustain step's job. */
type Presence = "silent" | "good" | "clipping";
const presenceOf = (status: LevelStatus): Presence => (status === "quiet" ? "good" : status);

const LEVEL_TEXT: Record<Presence, string> = {
  silent:   "text-zinc-400",
  good:     "text-emerald-400",
  clipping: "text-red-400",
};

const LEVEL_FILL: Record<Presence, string> = {
  silent:   "bg-zinc-600",
  good:     "bg-emerald-500",
  clipping: "bg-red-500",
};

/** One label style for every field on this screen. */
const FieldLabel = ({ children }: { children: ReactNode }) => (
  <span className="text-sm font-medium text-zinc-200">{children}</span>
);

/**
 * The live signal bar. It re-renders ~30 times a second on its own, so the
 * device pickers around it don't. The bar is clipped rather than resized — no
 * layout work per frame.
 */
const SignalMeter = React.memo(function SignalMeter({
  audioRefs, isListening, gain, onHeard,
}: {
  audioRefs: AudioRefs;
  isListening: boolean;
  gain: number;
  onHeard: () => void;
}) {
  const { t } = useTranslation("calibration");
  const level = useInputLevel(audioRefs, isListening, gain);
  const presence = presenceOf(level.status);
  const heard = isListening && level.heard;
  useEffect(() => { if (heard) onHeard(); }, [heard, onHeard]);

  return (
    <>
      {/* dB scale with a peak-hold tick; the label reads the held level, so
          it doesn't flip between two strums. */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <FieldLabel>{t("setup.signal_level")}</FieldLabel>
          <span className={cn("text-right text-sm", isListening ? LEVEL_TEXT[presence] : "text-zinc-400")}>
            {isListening ? t(`setup.level.${presence}`) : t("setup.connecting")}
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-lg bg-zinc-800">
          <div
            className={cn("absolute inset-0 rounded-lg", LEVEL_FILL[presence])}
            style={{ clipPath: `inset(0 ${(1 - level.meter) * 100}% 0 0 round 8px)` }}
          />
          {level.peak > 0.02 && (
            <div className="absolute inset-y-0 w-0.5 bg-zinc-200/70" style={{ left: `calc(${level.peak * 100}% - 1px)` }} />
          )}
        </div>
      </div>
      {heard && <ReadyCheck>{t("setup.ready")}</ReadyCheck>}
    </>
  );
});


/**
 * Electron-only: the interface, the jack the guitar is in, and where the app's
 * sound goes. Shares its persisted device id with the amp simulator
 * (useNativeAudioDevices), so a choice made here or in the amp panel applies
 * everywhere.
 */
function NativeDeviceFields({
  isListening, onSelectDevice, onSelectChannel,
}: {
  isListening: boolean;
  onSelectDevice?: (deviceId: number) => Promise<void>;
  onSelectChannel?: (channel: number) => Promise<void>;
}) {
  const { t } = useTranslation("calibration");
  const { devices, selectedId, selectedChannel, loading, refresh, select, selectChannel } = useNativeAudioDevices();
  const selectedDevice = devices.find((d) => d.id === selectedId);
  const output = useNativeOutputDevice(selectedDevice?.name);
  // ASIO4ALL holds the interface's outputs too, so the metronome can't play
  // through it — the one case worth a sentence on this screen.
  const isAsio4All = isExclusiveAsioWrapper(selectedDevice?.name);
  const channelCount = selectedDevice?.inputChannels ?? 0;

  const handleSelect = async (id: number) => {
    select(id);
    if (isListening) await onSelectDevice?.(id); // live stream → restart on the new device
  };

  const handleSelectChannel = async (channel: number) => {
    selectChannel(channel);
    if (isListening) await onSelectChannel?.(channel); // live stream → restart on the new channel
  };

  return (
    <div className="space-y-5">
      <AudioSelect
        label={<FieldLabel>{t("setup.interface")}</FieldLabel>}
        labelRight={
          <button
            type="button"
            onClick={() => refresh()}
            className="flex items-center gap-1.5 rounded text-sm text-zinc-400 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {t("setup.refresh")}
          </button>
        }
        value={selectedId !== null && selectedId !== undefined ? String(selectedId) : ""}
        onValueChange={(v) => void handleSelect(Number(v))}
        options={devices.map((d) => ({ value: String(d.id), label: d.name }))}
        placeholder={t("setup.no_inputs")}
        className="gap-2.5"
      />

      {channelCount > 1 && (
        <AudioSelect
          label={<FieldLabel>{t("setup.guitar_input")}</FieldLabel>}
          value={String(selectedChannel)}
          onValueChange={(v) => void handleSelectChannel(Number(v))}
          options={Array.from({ length: channelCount }, (_, i) => ({ value: String(i), label: t("setup.channel", { n: i + 1 }) }))}
          className="gap-2.5"
        />
      )}

      <AudioSelect
        label={<FieldLabel>{t("setup.output")}</FieldLabel>}
        value={output.selectedId ?? ""}
        onValueChange={(v) => output.select(v)}
        options={output.devices.map((d) => ({ value: d.deviceId, label: d.label || d.deviceId }))}
        placeholder={t("setup.no_outputs")}
        className="gap-2.5"
      />

      {isAsio4All && (
        <p className="text-sm leading-relaxed text-amber-400">{t("setup.output_hint_asio4all")}</p>
      )}
    </div>
  );
}

interface SetupStepProps {
  isListening:       boolean;
  isLoading:         boolean;
  inputSource:       InputSource;
  audioRefs:         AudioRefs;
  inputGain:         number;
  isNative:          boolean;
  onSelectDevice?:   (deviceId: number) => Promise<void>;
  onSelectChannel?:  (channel: number) => Promise<void>;
  onGrant:           () => void;
  onNext:            () => void;
  onBack:            () => void;
  onCancel:          () => void;
}

/**
 * Where the guitar comes in and how loud. Fields only — a label and a control
 * each, no explanations underneath; the one note that stays is the ASIO4ALL
 * warning, shown only when it applies.
 */
export const SetupStep = React.memo(function SetupStep({
  isListening, isLoading, inputSource, audioRefs, inputGain,
  isNative, onSelectDevice, onSelectChannel, onGrant, onNext, onBack, onCancel,
}: SetupStepProps) {
  const { t } = useTranslation("calibration");
  // Latched by the meter the first time it hears the guitar.
  const [heardOnce, setHeardOnce] = useState(false);
  const markHeard = useCallback(() => setHeardOnce(true), []);
  const heard = isListening && heardOnce;

  // The desktop app needs no permission to open the interface, so it starts
  // listening as soon as this screen shows — the meter answers "is my guitar
  // coming in?" while the devices are still being picked.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!isNative || isListening || autoStarted.current) return;
    autoStarted.current = true;
    onGrant();
  }, [isNative, isListening, onGrant]);

  const title = isNative ? t("setup.title_native")
    : inputSource === "interface" ? t("setup.title_interface")
    : t("setup.title_mic");

  return (
    <div className="flex flex-1 flex-col px-5 py-5 text-white sm:px-12 sm:py-10 shortwide:px-8 shortwide:py-4">
      <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8 shortwide:mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("back")}
            className="-ml-2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-zinc-50">{title}</h2>
        </div>
        <CloseButton onClick={onCancel} label={t("close")} />
      </div>

      <div className="flex w-full flex-1 flex-col gap-6 overflow-y-auto">
        {isNative ? (
          <NativeDeviceFields isListening={isListening} onSelectDevice={onSelectDevice} onSelectChannel={onSelectChannel} />
        ) : inputSource === "microphone" ? (
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>{t("setup.headphones")}</li>
            <li>{t("setup.quiet")}</li>
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-300">{t("setup.before_start_body")}</p>
        )}

        {(isListening || isLoading) && (
          <SignalMeter audioRefs={audioRefs} isListening={isListening} gain={inputGain} onHeard={markHeard} />
        )}

        <div className="mt-auto flex justify-end pt-2">
          {isListening ? (
            // No further until the guitar has actually been heard: every
            // later step listens to it.
            <Button onClick={onNext} disabled={!heard} className="h-12 w-full gap-2 px-6 text-base font-semibold sm:h-11 sm:w-auto">
              {t("setup.next")}
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onGrant} disabled={isLoading} className="h-12 w-full gap-2 px-6 text-base font-semibold sm:h-11 sm:w-auto">
              {isLoading ? t("setup.connecting") : isNative ? t("setup.start_listening") : t("setup.grant")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
