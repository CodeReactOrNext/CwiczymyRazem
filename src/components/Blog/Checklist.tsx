import { withCurrencyIcons } from "components/CurrencyIcons/withCurrencyIcons";
import React from "react";

// MDX content is compiled with no scope, so props must survive as plain strings
// — same pipe-delimited convention as StepList/AppCard.
interface ChecklistProps {
  /** Pipe-delimited items, each formatted as "Title::Description". */
  items: string;
}

const parseItems = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [title, description] = item.split("::").map((part) => part.trim());
      return { title, description };
    });

/**
 * Term-and-explanation list — "here are the five places things live", "here is
 * what each mode is". Despite the name it is almost never a list of things to
 * tick off: of the ~19 articles using it, one is an actual checklist.
 *
 * Two things this layout is deliberately *not*:
 *
 * - **A stack of cards.** That cost ~2rem of padding and gap per entry and drew
 *   a checkbox nobody can tick, so five short facts ran most of a screen.
 * - **A term column beside a description column.** Titles here run anywhere from
 *   "Songs" to "A live amp in your practice session", so any fixed column wide
 *   enough for the long ones wasted space on the short ones and any narrower one
 *   shredded them across three ragged lines.
 *
 * Instead: title directly above its own description (proximity does the pairing,
 * so the eye never travels), a wider gap between entries than inside them, and
 * two columns on desktop to halve the height of the long lists.
 */
export const Checklist = ({ items }: ChecklistProps) => {
  const parsed = parseItems(items);

  return (
    <dl className='not-prose my-8 grid gap-x-12 gap-y-6 rounded-xl bg-zinc-900/40 px-6 py-6 md:grid-cols-2 md:px-8 md:py-7'>
      {parsed.map((item) => (
        <div key={item.title}>
          <dt className='font-bold leading-snug text-white'>
            {withCurrencyIcons(item.title)}
          </dt>
          {item.description && (
            <dd className='mt-1 text-sm leading-relaxed text-zinc-400'>
              {withCurrencyIcons(item.description)}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
};
