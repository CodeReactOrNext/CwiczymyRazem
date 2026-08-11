import { AppScreen } from "./AppScreen";
import { parsePairs } from "./parseProps";

interface BoardPreviewProps {
  /** The mock window's header, e.g. `"Songs → Board"`. */
  title: string;
  /** Pipe-separated `"Column name::Card, Card, Card"` — one entry per column. */
  columns: string;
  caption?: string;
}

/**
 * Mock of a drag-and-drop board (the song Board, and anything else laid out in
 * columns), so an article can show the three-column shape instead of describing it.
 */
export const BoardPreview = ({ title, columns, caption }: BoardPreviewProps) => {
  const parsed = parsePairs(columns).map((column) => ({
    name: column.title,
    cards: (column.description ?? "")
      .split(",")
      .map((card) => card.trim())
      .filter(Boolean),
  }));

  return (
    <AppScreen title={title} caption={caption}>
      <div className='grid gap-4 sm:grid-cols-3'>
        {parsed.map((column) => (
          <div key={column.name}>
            <p className='mb-3 text-xs font-bold text-zinc-400'>{column.name}</p>
            <div className='flex flex-col gap-2'>
              {column.cards.map((card) => (
                <div
                  key={card}
                  className='rounded bg-zinc-800/40 px-3 py-2.5 text-xs font-medium text-zinc-200'>
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppScreen>
  );
};
