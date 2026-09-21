import { cn } from "assets/lib/utils";
import React from "react";

/**
 * A practice session drawn to scale instead of listed in a table. The stacked bar
 * makes the split between blocks readable at a glance, which a column of minutes
 * never manages: the point of the four-block routine is the proportion, not the
 * numbers. Optional session-length tabs let one plan carry a 15 / 30 / 60 minute
 * version without repeating the structure three times in the prose.
 *
 * Two constraints shape the implementation:
 *
 * 1. Post bodies are compiled to static HTML at build time and injected as markup
 *    (see renderBlogContent), because the script-src CSP has no 'unsafe-eval' and
 *    blocks client-side MDX evaluation. Nothing here hydrates, so the tabs are
 *    radio inputs driven by `peer-checked` rather than React state. Every panel
 *    ships in the markup and CSS picks which one is visible.
 * 2. MDX content compiles with no scope, so `{expression}` attributes would throw
 *    and every prop has to survive as a plain string (same constraint as
 *    SongRanking / StatRow).
 */
interface PracticeBlueprintProps {
  /** Pipe-delimited blocks, each `Label::minutes::Focus`, where `minutes` is a
   *  comma-separated value per session length, e.g. `Warm-Up::3,5,8::Stretches`. */
  blocks: string;
  /** Pipe-delimited tab labels, e.g. `15 min|30 min|60 min`. One label (or none)
   *  renders the plan without tabs. */
  lengths?: string;
  title?: string;
  /** One line under the plan, for the caveat a table has nowhere to put. */
  note?: string;
}

/** Colour carries the block's role rather than decoration: neutral warm-up, cyan
 *  for the technical core, amber for repertoire, emerald for the free block. */
const BLOCK_COLORS = [
  "bg-zinc-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
];

/* Tailwind resolves classes by scanning source text, so the peer variants have to
 * appear as whole literal strings. Four lengths is well past what a post needs. */
const PEER = ["peer/len0", "peer/len1", "peer/len2", "peer/len3"];
const TAB_ON = [
  "peer-checked/len0:bg-zinc-800 peer-checked/len0:text-zinc-100 peer-focus-visible/len0:ring-1 peer-focus-visible/len0:ring-cyan-500",
  "peer-checked/len1:bg-zinc-800 peer-checked/len1:text-zinc-100 peer-focus-visible/len1:ring-1 peer-focus-visible/len1:ring-cyan-500",
  "peer-checked/len2:bg-zinc-800 peer-checked/len2:text-zinc-100 peer-focus-visible/len2:ring-1 peer-focus-visible/len2:ring-cyan-500",
  "peer-checked/len3:bg-zinc-800 peer-checked/len3:text-zinc-100 peer-focus-visible/len3:ring-1 peer-focus-visible/len3:ring-cyan-500",
];
const PANEL_ON = [
  "peer-checked/len0:block",
  "peer-checked/len1:block",
  "peer-checked/len2:block",
  "peer-checked/len3:block",
];

const MAX_LENGTHS = PEER.length;

interface Block {
  label: string;
  minutes: number[];
  focus: string;
}

const parseBlocks = (blocks: string): Block[] =>
  blocks
    .split("|")
    .map((block) => {
      const [label = "", minutes = "", focus = ""] = block.split("::");
      return {
        label: label.trim(),
        minutes: minutes
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value) && value > 0),
        focus: focus.trim(),
      };
    })
    .filter((block) => block.label && block.minutes.length > 0);

/** A stable group name per plan, so two blueprints on one page never share radios.
 *  Derived from the content rather than useId, which keeps the markup identical
 *  between the build-time render and any future hydration. */
const groupName = (seed: string) => {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1)
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  return `plan-${hash.toString(36)}`;
};

/** A block listing fewer values than there are tabs keeps its last one, so a fixed
 *  two-minute cool-down does not have to be repeated once per session length. */
const minutesAt = (block: Block, index: number) =>
  block.minutes[index] ?? block.minutes[block.minutes.length - 1];

export const PracticeBlueprint = ({
  blocks,
  lengths,
  title,
  note,
}: PracticeBlueprintProps) => {
  const parsed = parseBlocks(blocks);
  if (parsed.length === 0) return null;

  const tabs = (lengths ?? "")
    .split("|")
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, MAX_LENGTHS);
  const showTabs = tabs.length > 1;
  const panels = showTabs ? tabs.map((_, index) => index) : [0];
  const group = groupName(`${title ?? ""}${blocks}`);

  const renderPanel = (index: number) => {
    const total = parsed.reduce(
      (sum, block) => sum + minutesAt(block, index),
      0,
    );

    return (
      <>
        <div className='flex w-full items-stretch gap-1' aria-hidden='true'>
          {parsed.map((block, i) => (
            <div
              key={block.label}
              style={{
                flexGrow: minutesAt(block, index),
                flexBasis: 0,
                minWidth: 8,
              }}
              className={cn(
                "h-2.5 rounded",
                BLOCK_COLORS[i % BLOCK_COLORS.length],
              )}
            />
          ))}
        </div>

        <ol className='m-0 mt-6 list-none space-y-5 p-0'>
          {parsed.map((block, i) => (
            <li key={block.label} className='m-0 p-0'>
              <div className='flex items-baseline gap-2.5'>
                <span
                  aria-hidden='true'
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    BLOCK_COLORS[i % BLOCK_COLORS.length],
                  )}
                />
                <span className='text-[15px] font-medium text-zinc-100'>
                  {block.label}
                </span>
                <span className='ml-auto shrink-0 text-sm tabular-nums text-zinc-400'>
                  {minutesAt(block, index)} min
                </span>
              </div>
              {block.focus && (
                <p className='m-0 ml-[18px] mt-1 text-sm leading-relaxed text-zinc-400'>
                  {block.focus}
                </p>
              )}
            </li>
          ))}
        </ol>

        <p className='m-0 mt-6 text-xs text-zinc-500'>
          {total} minutes total
          {note ? `. ${note}` : ""}
        </p>
      </>
    );
  };

  // The radios sit first and the tabs and panels after them, because `peer-checked`
  // compiles to a sibling selector and only reaches elements that follow the input.
  return (
    <div className='not-prose my-10 flex flex-wrap items-center gap-1 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      {showTabs &&
        tabs.map((label, index) => (
          <input
            key={`${group}-input-${label}`}
            type='radio'
            id={`${group}-${index}`}
            name={group}
            defaultChecked={index === 0}
            className={cn("sr-only", PEER[index])}
          />
        ))}

      {title && (
        <p className='m-0 mr-auto text-[15px] font-semibold text-zinc-100'>
          {title}
        </p>
      )}

      {showTabs &&
        tabs.map((label, index) => (
          <label
            key={`${group}-tab-${label}`}
            htmlFor={`${group}-${index}`}
            className={cn(
              "cursor-pointer rounded px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200",
              TAB_ON[index],
            )}>
            {label}
          </label>
        ))}

      {panels.map((index) => (
        <div
          key={`${group}-panel-${index}`}
          className={cn(
            "w-full",
            title || showTabs ? "mt-6" : "",
            showTabs ? cn("hidden", PANEL_ON[index]) : "block",
          )}>
          {renderPanel(index)}
        </div>
      ))}
    </div>
  );
};
