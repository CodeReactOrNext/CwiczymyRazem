import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";

import type { BreakdownRow } from "../utils/rewardBreakdown";
import { RewardBreakdown } from "./RewardBreakdown";

interface DetailLine {
  key: string;
  label: string;
  value: string;
}

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className='space-y-4'>
    <h3 className='font-display text-lg font-bold text-zinc-100'>{title}</h3>
    {children}
  </section>
);

const Lines = ({ lines }: { lines: DetailLine[] }) => (
  <ul className='space-y-3'>
    {lines.map((line) => (
      <li key={line.key} className='flex justify-between gap-4 text-sm'>
        <span className='text-zinc-300'>{line.label}</span>
        <span className='font-bold tabular-nums text-zinc-100'>{line.value}</span>
      </li>
    ))}
  </ul>
);

/** A breakdown worth showing — one plain line only repeats its headline (see RewardBreakdown). */
const hasRows = (rows: BreakdownRow[]) => rows.length > 1 || (rows[0]?.subs.length ?? 0) > 0;

interface SessionDetailsProps {
  pointRows: BreakdownRow[];
  fameRows: BreakdownRow[];
  time: DetailLine[];
  skills: DetailLine[];
}

/** Where the numbers came from, under the numbers themselves. Nothing when none of them has parts. */
export const SessionDetails = ({ pointRows, fameRows, time, skills }: SessionDetailsProps) => {
  const { t } = useTranslation("session_summary");
  if (!hasRows(pointRows) && !hasRows(fameRows) && time.length === 0 && skills.length === 0) return null;

  return (
    <div className='grid w-full gap-x-12 gap-y-9 rounded-lg bg-zinc-800/40 p-6 text-left sm:grid-cols-2 sm:p-8 shortwide:grid-cols-2'>
      {hasRows(pointRows) && (
        <Block title={t("points")}>
          <RewardBreakdown rows={pointRows} delay={0} className='mx-0 w-full max-w-none' />
        </Block>
      )}
      {hasRows(fameRows) && (
        <Block title={t("fame")}>
          <RewardBreakdown rows={fameRows} delay={0} className='mx-0 w-full max-w-none' />
        </Block>
      )}
      {time.length > 0 && (
        <Block title={t("session_time")}>
          <Lines lines={time} />
        </Block>
      )}
      {skills.length > 0 && (
        <Block title={t("skills")}>
          <Lines lines={skills} />
        </Block>
      )}
    </div>
  );
};
