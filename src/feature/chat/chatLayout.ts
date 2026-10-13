/**
 * The avatar column beside a run of messages. A phone gets the 32px avatar
 * (Avatar "xs") with a tighter gap, so the bubbles keep the width.
 */
export const AVATAR_COLUMN = "w-8 sm:w-10";
export const AVATAR_GAP = "gap-2 sm:gap-3";

/**
 * Shrinks an Avatar size="sm" (40px) to 32px below `sm`. Mobile-first, because
 * the raw `short` screens in the config switch Tailwind's `max-*` variants off.
 */
export const AVATAR_SHRINK =
  "[&>div]:h-8 [&>div]:w-8 sm:[&>div]:h-10 sm:[&>div]:w-10";

/** Avatar column plus the gap beside it — where a group's text starts. */
export const AVATAR_INSET = "pl-10 sm:pl-[52px]";
export const AVATAR_INSET_END = "pr-10 sm:pr-[52px]";
