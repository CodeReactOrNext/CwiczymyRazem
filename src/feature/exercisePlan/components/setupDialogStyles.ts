/**
 * Shared look of the "set up an exercise" dialogs (chords, scales, custom
 * exercise, practice time). The chord dialog is the reference; every other
 * setup dialog builds from these classes so they stay one family: same
 * padding, same field surface, same spacing, same footer.
 */

/** DialogContent: flex column capped to the screen, middle part scrolls. */
export const SETUP_DIALOG_CONTENT =
  "!flex max-h-[100dvh] flex-col sm:max-h-[92dvh]";

/** Scrolling body between the header and the footer. */
export const SETUP_DIALOG_BODY =
  "min-h-0 flex-1 space-y-8 overflow-y-auto py-4 pr-1";

/** Footer row with Cancel (outline) + primary action (default). */
export const SETUP_DIALOG_FOOTER = "flex shrink-0 justify-end gap-3 pt-2";

/** Background surface for grouped content (sequence, file chip, list rows). */
export const SETUP_SURFACE = "rounded-lg bg-zinc-900/60";

/**
 * Input / Textarea / SelectTrigger in the setup dialogs: the base field
 * (filled, borderless) at the dialogs' taller row height.
 */
export const SETUP_FIELD = "h-11";
