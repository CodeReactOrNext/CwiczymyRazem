import { useState, useCallback, useMemo } from "react";

export interface CalibrationOffsets {
  [stringNumber: number]: number; // cents: + = sharp, − = flat
}

export interface CalibrationData {
  offsets: CalibrationOffsets;
  timestamp: number;
}

export type SessionPhase = "mic_prompt" | "calibration_choice" | "calibrating" | "ready";

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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalibrationData;
    if (parsed && parsed.offsets && typeof parsed.timestamp === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCalibrationToStorage(data: CalibrationData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silently fail if storage is full
  }
}

export function useCalibration(planHasTablature: boolean) {
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

  const existingStoredData = useMemo(() => loadCalibrationFromStorage(), []);
  const existingCalibrationTimestamp = existingStoredData?.timestamp ?? 0;

  const handleEnableMic = useCallback(() => {
    saveMicPreference(true);
    if (existingStoredData) {
      setSessionPhase("calibration_choice");
    } else {
      setSessionPhase("calibrating");
    }
  }, [existingStoredData]);

  const handleSkipMic = useCallback(() => {
    saveMicPreference(false);
    setIsMicEnabled(false);
    setSessionPhase("ready");
  }, []);

  const handleReuseCalibration = useCallback(() => {
    if (existingStoredData) {
      setCalibrationData(existingStoredData);
    }
    setIsMicEnabled(true);
    setSessionPhase("ready");
  }, [existingStoredData]);

  const handleRecalibrate = useCallback(() => {
    setSessionPhase("calibrating");
  }, []);

  const handleCalibrationComplete = useCallback((data: CalibrationData) => {
    saveCalibrationToStorage(data);
    setCalibrationData(data);
    setIsMicEnabled(true);
    setSessionPhase("ready");
  }, []);

  const handleCalibrationCancel = useCallback(() => {
    setSessionPhase("mic_prompt");
  }, []);

  const getAdjustedTargetFreq = useCallback(
    (stringNumber: number, baseFreq: number): number => {
      if (!calibrationData) return baseFreq;
      const offsetCents = calibrationData.offsets[stringNumber] || 0;
      return baseFreq * Math.pow(2, offsetCents / 1200);
    },
    [calibrationData]
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
