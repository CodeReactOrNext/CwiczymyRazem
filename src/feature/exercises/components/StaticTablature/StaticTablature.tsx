import type { TablatureMeasure } from 'feature/exercisePlan/types/exercise.types';

interface StaticTablatureProps {
  measures?: TablatureMeasure[];
  maxMeasures?: number;
  className?: string;
}

/**
 * Render tablature as ASCII text suitable for HTML <pre> — SEO-friendly and readable.
 * Pattern (guitar tuning EADGBE, displayed high-E to low-E top-to-bottom):
 *   e|--0---3---|--5------|
 *   B|---1------|---------|
 *   G|----------|---------|
 *   D|----------|---------|
 *   A|----------|---------|
 *   E|----------|---------|
 */
export const StaticTablature: React.FC<StaticTablatureProps> = ({
  measures,
  maxMeasures = 4,
  className = '',
}) => {
  if (!measures || measures.length === 0) {
    return null;
  }

  const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E']; // Strings 1-6 (high E to low E)
  const CELL_WIDTH = 3; // Base character width per beat unit

  // Initialize tab lines (one per string)
  const tabLines: string[] = Array(6).fill('');

  // Iterate through measures (capped at maxMeasures for SSG display)
  const displayMeasures = measures.slice(0, maxMeasures);

  for (const measure of displayMeasures) {
    // For each beat in the measure
    for (const beat of measure.beats) {
      // Width of this beat's cell: round(duration / 0.25) * CELL_WIDTH
      // duration 1 = 4 units = 12 chars, duration 0.5 = 2 units = 6 chars, etc.
      const beatUnits = Math.max(1, Math.round(beat.duration / 0.25));
      const slotWidth = beatUnits * CELL_WIDTH;

      // For each string (1-6), collect the note or dash
      for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
        const stringNum = stringIdx + 1; // 1-6
        const note = beat.notes.find((n) => n.string === stringNum);

        let cellContent = '';
        if (note) {
          // Render fret number (0-2 digits)
          cellContent = String(note.fret).padEnd(2);

          // Add note modifiers as suffixes if room
          if (note.isDead) cellContent = 'x'.padEnd(2);
          else if (note.isHammerOn) cellContent += 'h';
          else if (note.isPullOff) cellContent += 'p';
          else if (note.isBend) cellContent += 'b';
          else if (note.isVibrato) cellContent += '~';
        } else {
          // No note on this string — fill with dashes
          cellContent = '-'.repeat(Math.min(2, slotWidth));
        }

        // Pad to slot width
        tabLines[stringIdx] += cellContent.padEnd(slotWidth, '-');
      }
    }

    // End of measure: add pipe separator
    for (let i = 0; i < 6; i++) {
      tabLines[i] += '|';
    }
  }

  // Build final lines with string labels
  const output = STRING_NAMES.map((name, idx) => `${name}|${tabLines[idx]}`).join(
    '\n'
  );

  return (
    <div className={`overflow-x-auto ${className}`}>
      <pre className="font-mono text-xs leading-5 text-zinc-300 bg-zinc-900 p-4 rounded-lg whitespace-pre-wrap break-words">
        {output}
      </pre>
    </div>
  );
};
