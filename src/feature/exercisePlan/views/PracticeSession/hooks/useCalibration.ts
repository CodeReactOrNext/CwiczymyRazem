import { useCallback,useState } from "react";

export interface CalibrationOffsets {
  [stringNumber: number]: number; // cents: + = sharp, − = flat
}

export interface CalibrationData {
  offsets: CalibrationOffsets;
  timestamp: number;
}

type SessionPhase = "mic_prompt" | "calibration_choice" | "calibrating" | "ready";

const STORAGE_KEY = "guitar_calibration_data";
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

function loadCalibrationFromStorage(): CalibrationData | null {
  return null;
}

function saveCalibrationToStorage(data: CalibrationData): void {
  // Disabled
}

/**
 * @param micRequired exams, goal runs and duels only count mic-scored runs —
 *   closing the setup wizard there must not leave the session running with
 *   the mic off, so it goes back to the mic prompt instead.
 */
export function useCalibration(planHasTablature: boolean, micRequired = false) {
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>(() => {
    const pref = loadMicPreference();
    if (pref !== null || !planHasTablature) return "ready";
    return "mic_prompt";
  });
  const [isMicEnabled, setIsMicEnabled] = useState(() => {
    const pref = loadMicPreference();
    return pref ?? false;
  });
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);

  const existingStoredData = null;
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
    if (existingStoredData) {
      setCalibrationData(existingStoredData);
    }
    saveMicPreference(true);
    setIsMicEnabled(true);
    setSessionPhase("ready");
  }, [existingStoredData]);

  const handleRecalibrate = useCallback(() => {
    setSessionPhase("calibrating");
  }, []);

  const handleCalibrationComplete = useCallback((data: CalibrationData) => {
    // We no longer save offset data
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
    calibrationData,
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
