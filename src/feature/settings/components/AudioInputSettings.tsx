import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import {
  helpItems,
  NativeDeviceFields,
  NoSignalHelp,
  SignalMeter,
  WebDeviceFields,
} from "feature/exercisePlan/views/PracticeSession/components/CalibrationWizard/components/SetupStep";
import { loadInputSource } from "feature/exercisePlan/views/PracticeSession/components/CalibrationWizard/inputSource";
import type { AudioInitFailure } from "hooks/useAudioAnalyzer";
import { useGuitarAudioInput } from "hooks/useGuitarAudioInput";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useEffect, useState } from "react";

/** Silence this long while checking brings up the checklist, as in the session's setup. */
const NO_SIGNAL_HELP_MS = 6000;

/**
 * Settings → Profile. The device the app listens to, pickable before the first
 * session: it used to be reachable only from inside a practice session with a
 * tab. Same fields and the same saved choice as the session's input setup, so
 * what is picked here is what the session opens.
 *
 * Nothing is opened until "Check input" is pressed — the browser asks for
 * microphone access at that moment, and the input closes on leaving the page.
 */
export const AudioInputSettings = () => {
  const { t } = useTranslation("settings");
  const { t: tSetup } = useTranslation("calibration");
  const audio = useGuitarAudioInput();
  const { isListening, isNative, webInput } = audio;

  const [isStarting, setIsStarting] = useState(false);
  const [failure, setFailure] = useState<AudioInitFailure | null>(null);
  const [heard, setHeard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [inputSource] = useState(loadInputSource);

  const start = async () => {
    setIsStarting(true);
    setFailure(null);
    setHeard(false);
    setShowHelp(false);
    try {
      const result = await audio.init();
      if (result && !result.ok) setFailure(result.reason);
    } finally {
      setIsStarting(false);
    }
  };

  const markHeard = useCallback(() => setHeard(true), []);

  useEffect(() => {
    if (!isListening || heard) return undefined;
    const timer = setTimeout(() => setShowHelp(true), NO_SIGNAL_HELP_MS);
    return () => clearTimeout(timer);
  }, [isListening, heard]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("audio_input.title")}</CardTitle>
        <CardDescription>{t("audio_input.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-lg bg-zinc-900/40 px-4 py-3'>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-200'>
              {t("audio_input.check_label")}
            </p>
            <p className='mt-1 text-sm text-zinc-400'>
              {t("audio_input.check_description")}
            </p>
          </div>
          {isListening ? (
            <Button variant='secondary' onClick={() => audio.close()}>
              {t("audio_input.stop")}
            </Button>
          ) : (
            <Button onClick={() => void start()} disabled={isStarting}>
              {isStarting ? t("audio_input.starting") : t("audio_input.start")}
            </Button>
          )}
        </div>

        {failure && !isListening && (
          <div role='alert' className='space-y-1.5 rounded-lg bg-red-500/10 px-4 py-3'>
            <p className='text-sm font-semibold text-red-300'>
              {tSetup(`error.reasons.${failure}.title`)}
            </p>
            <p className='text-sm leading-relaxed text-zinc-300'>
              {tSetup(`error.reasons.${failure}.body`)}
            </p>
          </div>
        )}

        {isListening && (
          <div className='space-y-6'>
            {isNative ? (
              <NativeDeviceFields
                isListening={isListening}
                onSelectDevice={audio.selectDevice}
                onSelectChannel={audio.selectChannel}
              />
            ) : (
              webInput && (
                <WebDeviceFields input={webInput} inputSource={inputSource} onInputError={setFailure} />
              )
            )}
            <SignalMeter
              audioRefs={audio.audioRefs}
              isListening={isListening}
              gain={audio.inputGain}
              onHeard={markHeard}
              readyText={t("audio_input.heard")}
            />
            {showHelp && !heard && (
              <NoSignalHelp items={helpItems(isNative, inputSource, webInput?.channelCount ?? 0)} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
