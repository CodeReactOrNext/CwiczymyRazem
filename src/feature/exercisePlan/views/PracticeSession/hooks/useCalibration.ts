import { useCallback, useEffect, useState } from "react";

type SessionPhase = "mic_prompt" | "calibration_choice" | "calibrating" | "ready";

const MIC_PREFERENCE_KEY = "mic_tracking_enabled";

function loadMicPreference(): boolean | null {
  try {
    const raw = localStorage.getItem(MIC_PREFERENCE_KEY);
    if (raw === null) return null;
    return raw === "true";
  } catch {
    return null;
  }
}

function saveMicPreference(enabled: boolean): void {
  try {
    localStorage.setItem(MIC_PREFERENCE_KEY, String(enabled));
  } catch { }
}

/**
 * @param micRequired exams, goal runs and duels only count mic-scored runs —
 *   closing the setup wizard there must not leave the session running with
 *   the mic off, so it goes back to the mic prompt instead.
 * @param micStart the player already answered the mic question before the
 *   session (the onboarding's first riff), so it is not asked again:
 *   "setup" opens straight on the setup wizard — also when the mic was set up
 *   before, where it runs as a recalibration over the already-on mic and
 *   closing it just leaves the mic on. "off" starts with the mic off and
 *   saves that as the player's preference, so later sessions don't ask again
 *   (the mic button in the session still turns it on).
 */
export function useCalibration(
  planHasTablature: boolean,
  micRequired = false,
  micStart?: "setup" | "off",
) {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>(() => {
    const pref = loadMicPreference();
    if (!planHasTablature || micStart === "off") return "ready";
    if (micStart === "setup") return "calibrating";
    if (pref !== null) return "ready";
    return "mic_prompt";
  });
  const [isMicEnabled, setIsMicEnabled] = useState(() => {
    if (micStart === "off") return false;
    const pref = loadMicPreference();
    return pref ?? false;
  });
  // "No mic" given before the session is the player's answer like any other:
  // remembered, so the sessions that follow don't ask again.
  useEffect(() => {
    if (micStart === "off") saveMicPreference(false);
  }, [micStart]);
  // Nothing from the setup wizard is stored any more (its tuning step is a
  // plain tuner), so there is never an earlier setup to offer reusing.
  const existingCalibrationTimestamp = 0;

  // The preference is only saved once the wizard finishes: saving it here left
  // "on" in storage while a cancelled wizard kept the mic off, so the next
  // session silently turned it on and this one never asked again.
  const handleEnableMic = useCallback(() => {
    setSessionPhase("calibrating");
  }, []);

  const handleSkipMic = useCallback(() => {
    saveMicPreference(false);
    setIsMicEnabled(false);
    setSessionPhase("ready");
  }, []);

  const handleReuseCalibration = useCallback(() => {
    saveMicPreference(true);
    setIsMicEnabled(true);
    setSessionPhase("ready");
  }, []);

  const handleRecalibrate = useCallback(() => {
    setSessionPhase("calibrating");
  }, []);

  const handleCalibrationComplete = useCallback(() => {
    saveMicPreference(true);
    setIsMicEnabled(true);
    setSessionPhase("ready");
  }, []);

  const handleCalibrationCancel = useCallback(() => {
    // Recalibrating with the mic already on just closes the wizard.
    setSessionPhase(micRequired && !isMicEnabled ? "mic_prompt" : "ready");
  }, [micRequired, isMicEnabled]);

  const getAdjustedTargetFreq = useCallback(
    (stringNumber: number, baseFreq: number): number => {
      return baseFreq; // Calibration feature completely disabled by user request. Always expect correct standard frequency.
    },
    []
  );

  return {
    sessionPhase,
    isMicEnabled,
    handleEnableMic,
    handleSkipMic,
    handleReuseCalibration,
    handleRecalibrate,
    handleCalibrationComplete,
    handleCalibrationCancel,
    getAdjustedTargetFreq,
    existingCalibrationTimestamp,
    setIsMicEnabled: (enabled: boolean) => {
      setIsMicEnabled(enabled);
      saveMicPreference(enabled);
    },
    setSessionPhase,
  };
}
