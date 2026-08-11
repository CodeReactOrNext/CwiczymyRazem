import type { BuildLogEntry } from "feature/arsenal/types/arsenal.types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { SectionLabel } from "../SectionLabel";

/** How much of the chronicle is worth reading at a glance. */
const VISIBLE_ENTRIES = 5;

interface BuildLogProps {
  entries: BuildLogEntry[];
}

const formatDate = (at?: number): string =>
  at ? new Date(at).toLocaleDateString() : "";

/**
 * A record of the work done on this instrument, newest first.
 *
 * It is a chronicle and nothing more: what the item *is* — its mods, its level,
 * its condition — is stated everywhere else on the bench, so the log folds away
 * and shows only the last few jobs when opened.
 */
export const BuildLog = ({ entries }: BuildLogProps) => {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  const recent = [...entries].reverse().slice(0, VISIBLE_ENTRIES);

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-6'>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className='flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50'>
        <span className='flex flex-col gap-1'>
          <SectionLabel>Build log</SectionLabel>
          <span className='text-xs text-zinc-500'>
            Bench work done on this one, newest first
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className='flex flex-col gap-2.5'>
          {recent.map((entry, i) => (
            <div
              key={`${entry.label}-${entry.at ?? i}`}
              className='flex items-baseline justify-between gap-4'>
              <span className='text-sm text-zinc-300'>{entry.label}</span>
              <span className='shrink-0 text-xs tabular-nums text-zinc-600'>
                {formatDate(entry.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
