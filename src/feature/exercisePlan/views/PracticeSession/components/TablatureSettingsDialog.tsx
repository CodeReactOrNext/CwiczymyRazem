import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";

import { TablatureSettingsPanel } from "./TablatureSettingsPanel";

interface TablatureSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * In-session shortcut to the tablature look settings. The full set — including
 * the 3D highway sliders and a live preview — also lives under Settings →
 * Tablature; both edit the same persisted store.
 */
export function TablatureSettingsDialog({
  open,
  onOpenChange,
}: TablatureSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The practice session is itself a full-screen layer at z-[999999], so the
          default z-50 dialog renders behind it — visible to hit-testing (that layer
          is pointer-events:none while a modal is open) but painted over. Both the
          panel and its backdrop have to clear it. */}
      <DialogContent
        className='z-[9999999] bg-zinc-950 text-white sm:max-w-2xl'
        overlayClassName='z-[9999999]'>
        <DialogHeader>
          <DialogTitle>Tablature settings</DialogTitle>
          <DialogDescription className='text-zinc-400'>
            Personalise how the tab looks. Changes apply straight away and are
            remembered on this device.
          </DialogDescription>
        </DialogHeader>

        {/* The dialog shell does not scroll on desktop (sm:h-auto + overflow-visible),
            so the settings list owns its own scroll — otherwise the lower sections
            fall off-screen and become unreachable. */}
        <div className='max-h-[70vh] overflow-y-auto pb-2 pr-1'>
          <TablatureSettingsPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
