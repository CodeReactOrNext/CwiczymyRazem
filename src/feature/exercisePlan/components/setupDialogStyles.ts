/**
 * Shared look of the "set up an exercise" dialogs (chords, scales, custom
 * exercise, practice time). The chord dialog is the reference; every other
 * setup dialog builds from these classes so they stay one family: same
 * padding, same field surface, same spacing, same footer.
 */

/** DialogContent: flex column capped to the screen, middle part scrolls. */
export const SETUP_DIALOG_CONTENT =
  "!flex max-h-[100dvh] flex-col sm:max-h-[92dvh] sm:max-w-[550px]";

/** Scrolling body between the header and the footer. */
export const SETUP_DIALOG_BODY =
  "min-h-0 flex-1 space-y-8 overflow-y-auto py-4 pr-1";

/** Footer row with Cancel (outline) + primary action (default). */
export const SETUP_DIALOG_FOOTER = "flex shrink-0 justify-end gap-3 pt-2";

/** Background surface for grouped content (sequence, file chip, list rows). */
export const SETUP_SURFACE = "rounded-lg bg-zinc-900/60";

/**
 * Input / Textarea / SelectTrigger: a filled surface instead of the base
 * bordered, transparent field — matches SETUP_SURFACE.
 */
export const SETUP_FIELD =
  "h-11 rounded-lg border-0 bg-zinc-900/60 text-zinc-100 shadow-none transition-colors placeholder:text-zinc-500 hover:bg-zinc-900 focus:ring-1 focus:ring-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-500";
