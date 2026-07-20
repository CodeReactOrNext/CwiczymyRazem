import type { SeoLandingSchedule } from "../types/seoLanding.types";
import { InlineText } from "./InlineText";

/** Practice-plan table (routine blocks, minute breakdowns) for landing pages. */
export const ScheduleTable = ({ schedule }: { schedule: SeoLandingSchedule }) => {
  return (
    <div className='overflow-hidden rounded-lg bg-zinc-900/40'>
      {schedule.title && (
        <p className='px-5 pt-5 text-sm font-semibold text-zinc-200'>
          {schedule.title}
        </p>
      )}
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-left'>
          <thead>
            <tr>
              {schedule.columns.map((column) => (
                <th
                  key={column}
                  className='px-5 py-4 text-xs font-bold tracking-wide text-cyan-400'>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className='even:bg-zinc-800/30'>
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={
                      cellIdx === 0
                        ? "whitespace-nowrap px-5 py-4 align-top text-sm font-semibold text-white"
                        : "px-5 py-4 align-top text-sm leading-relaxed text-zinc-400"
                    }>
                    <InlineText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
