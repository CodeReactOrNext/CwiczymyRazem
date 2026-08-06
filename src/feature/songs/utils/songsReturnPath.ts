import { resolveInternalPath } from "utils/resolveInternalPath";

/** Songs board — where a finished song session should drop the user off. */
export const SONGS_PAGE_PATH = "/songs?view=board";

/**
 * Resolves the page to return to after a song practice session.
 *
 * Finishing a song session lands on the songs page (ready to pick the next one),
 * not on the dashboard. A caller can override the destination with a `returnTo`
 * query param.
 */
export const resolveSongsReturnPath = (returnTo: string | string[] | undefined): string =>
  resolveInternalPath(returnTo, SONGS_PAGE_PATH);
