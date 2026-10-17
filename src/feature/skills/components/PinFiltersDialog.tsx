import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { useDashboardLayout } from "feature/dashboard/hooks/useDashboardLayout";
import {
  addCustomShortcut,
  addWidget,
  hasWidget,
  isShortcutLimitReached,
  MAX_CUSTOM_SHORTCUT_LABEL,
  MAX_SHORTCUTS,
} from "feature/dashboard/utils/dashboardLayout";
import { useState } from "react";
import { toast } from "sonner";

interface PinFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAuth: string | null;
  /** Where the shortcut leads — the exercise list with the current filters. */
  href: string;
  /** Name suggested from the filters, e.g. "No guitar · Under 2 min". */
  suggestedLabel: string;
}

/**
 * Saves the current Browse Exercises filters as a shortcut on Home, so a
 * combination the player keeps coming back to is one tap away. Mount it only
 * while open, so every opening starts from the current filters' name.
 */
export const PinFiltersDialog = ({
  open,
  onOpenChange,
  userAuth,
  href,
  suggestedLabel,
}: PinFiltersDialogProps) => {
  const { layout, isLoading, updateLayout } = useDashboardLayout(userAuth);
  const [label, setLabel] = useState(suggestedLabel);
  const limitReached = isShortcutLimitReached(layout);
  const canSave = !!label.trim() && !limitReached && !isLoading && !!userAuth;

  const handleSave = () => {
    if (!canSave) return;
    let next = addCustomShortcut(layout, { label, href });
    // A shortcut on a hidden card would just vanish - bring the card back.
    if (!hasWidget(next, "shortcuts")) next = addWidget(next, "shortcuts");
    updateLayout(next);
    toast.success("Pinned to Home");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/5 bg-zinc-950 p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Pin to Home</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Adds a shortcut to the Shortcuts card on Home that opens this list with these filters.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-2 pt-2"
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}>
          <label htmlFor="pin-filters-label" className="text-sm font-bold text-zinc-400">
            Name
          </label>
          <Input
            id="pin-filters-label"
            value={label}
            maxLength={MAX_CUSTOM_SHORTCUT_LABEL}
            onChange={e => setLabel(e.target.value)}
            autoFocus
            className="h-11 border-white/5 bg-white/5 text-base text-zinc-100 sm:text-sm"
          />
          {limitReached && (
            <p className="text-xs font-semibold text-amber-400">
              Your Shortcuts card is full ({MAX_SHORTCUTS}). Unpin one on Home first.
            </p>
          )}
        </form>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} className="bg-white text-zinc-950 hover:bg-zinc-200">
            Pin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
