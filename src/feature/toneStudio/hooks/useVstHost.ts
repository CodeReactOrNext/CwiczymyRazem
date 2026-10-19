import {
  addToVstRack,
  addVstPluginFile,
  addVstPluginFolder,
  closeVstSlotEditor,
  dismissVstError,
  initVstHost,
  moveInVstRack,
  openVstSlotEditor,
  removeFromVstRack,
  removeVstSource,
  scanVstPlugins,
  setVstSlotBypass,
  useVstHostStore,
} from "feature/toneStudio/services/vstHostStore";
import { useEffect } from "react";

/**
 * Tone Studio's VST mode: plugin library + rack. `available` is false on the
 * web and on desktop shells that predate plugin hosting, so callers can render
 * unconditionally and gate on it.
 */
export const useVstHost = () => {
  const state = useVstHostStore();

  useEffect(() => {
    initVstHost();
  }, []);

  return {
    ...state,
    scan: scanVstPlugins,
    addFile: addVstPluginFile,
    addFolder: addVstPluginFolder,
    removeSource: removeVstSource,
    addToRack: addToVstRack,
    removeFromRack: removeFromVstRack,
    moveInRack: moveInVstRack,
    setBypass: setVstSlotBypass,
    openEditor: openVstSlotEditor,
    closeEditor: closeVstSlotEditor,
    dismissError: dismissVstError,
  };
};
