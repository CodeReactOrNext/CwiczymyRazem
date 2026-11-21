/**
 * A beat made only of dead notes — a fret-hand-muted scratch across several
 * strings — is one stroke of the pick, and the microphone hears it as one
 * click with no pitch. It is graded as a single note: grading every string on
 * its own turned one missed scratch into a miss per string.
 */
export const isMuteStrum = (notes: readonly { isDead?: boolean }[]): boolean =>
  notes.length > 1 && notes.every((note) => note.isDead);

/** How many graded notes a beat stands for. */
export const gradedNoteCount = (notes: readonly { isDead?: boolean }[]): number =>
  isMuteStrum(notes) ? 1 : notes.length;
