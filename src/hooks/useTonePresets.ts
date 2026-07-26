import { BUILT_IN_PRESETS } from "feature/toneStudio/data/builtInPresets";
import { useCallback, useEffect, useState } from "react";
import type { AmpParams } from "types/nativeAudio";
import type { ImportedIR, ImportedNamModel, TonePreset } from "types/toneStudio";

// Electron-only. Wraps window.toneStudio (preset/IR/NAM-model CRUD) and merges the
// hardcoded built-in presets with whatever the user has saved locally.
export const useTonePresets = () => {
  const [presets, setPresets] = useState<TonePreset[]>(BUILT_IN_PRESETS);
  const [irs, setIrs] = useState<ImportedIR[]>([]);
  const [namModels, setNamModels] = useState<ImportedNamModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingNamModel, setImportingNamModel] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.toneStudio) return;
    setLoading(true);
    try {
      const [userPresets, userIrs, userNamModels] = await Promise.all([
        window.toneStudio.listPresets(),
        window.toneStudio.listIRs(),
        window.toneStudio.listNamModels(),
      ]);
      setPresets([...BUILT_IN_PRESETS, ...userPresets]);
      setIrs(userIrs);
      setNamModels(userNamModels);
    } catch {
      /* ignore — keep whatever was already loaded */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const savePreset = useCallback(async (name: string, params: AmpParams) => {
    if (!window.toneStudio) return null;
    const preset: TonePreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      params,
      builtIn: false,
      createdAt: Date.now(),
    };
    const saved = await window.toneStudio.savePreset(preset);
    await refresh();
    return saved;
  }, [refresh]);

  const deletePreset = useCallback(async (id: string) => {
    if (!window.toneStudio) return;
    await window.toneStudio.deletePreset(id);
    await refresh();
  }, [refresh]);

  const importIR = useCallback(async () => {
    if (!window.toneStudio) return null;
    setImporting(true);
    try {
      const meta = await window.toneStudio.importIR();
      if (meta) await refresh();
      return meta;
    } finally {
      setImporting(false);
    }
  }, [refresh]);

  const deleteIR = useCallback(async (id: string) => {
    if (!window.toneStudio) return;
    await window.toneStudio.deleteIR(id);
    await refresh();
  }, [refresh]);

  const importNamModel = useCallback(async () => {
    if (!window.toneStudio) return null;
    setImportingNamModel(true);
    try {
      const meta = await window.toneStudio.importNamModel();
      if (meta) await refresh();
      return meta;
    } finally {
      setImportingNamModel(false);
    }
  }, [refresh]);

  const deleteNamModel = useCallback(async (id: string) => {
    if (!window.toneStudio) return;
    await window.toneStudio.deleteNamModel(id);
    await refresh();
  }, [refresh]);

  return {
    presets, irs, namModels, loading, importing, importingNamModel,
    savePreset, deletePreset, importIR, deleteIR, importNamModel, deleteNamModel, refresh,
  };
};
