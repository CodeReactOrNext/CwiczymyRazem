import React from 'react';

/**
 * Real session-length distribution from the Riff Quest `logs` collection,
 * measured by `npm run session-length-stats` (scripts/sessionLengthStats.test.ts).
 * Rerun it and paste the printed numbers here; nothing on this card is estimated.
 *
 * Until 2026-11-01 this card showed only a mean, because the aggregate query
 * behind the hero stats returns a count and a sum. It also credited the sample
 * to every registered account (3,980) instead of the players who actually logged
 * a session (854). The script reads each session's duration, so the card now
 * shows medians and quartiles with the true sample.
 */
const MEASURED_ON = '1 November 2026';
const PLAYERS = '854';
const SESSIONS = '18,473';
const PRACTICE_DAYS = '6,958';
const DAY_MEDIAN = 51;
const DAY_P25 = 20;
const DAY_P75 = 110;
const SESSION_MEDIAN = 9;
const SESSION_MEAN = 35;

const Figure = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="text-4xl font-bold tracking-tight text-cyan-400 light:text-cyan-700">
      {value}
    </p>
    <p className="mt-2 text-sm text-zinc-300 light:text-zinc-700">{label}</p>
  </div>
);

export const SessionLengthStat = () => {
  return (
    <div className="not-prose my-10 rounded-lg bg-zinc-900/40 p-6 light:bg-zinc-100">
      <p className="text-sm font-medium text-zinc-200 light:text-zinc-900">
        How long do Riff Quest players actually practise?
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Figure
          value={`${DAY_MEDIAN} min`}
          label={`Median practice day. Half of all practice days fall between ${DAY_P25} and ${DAY_P75} minutes.`}
        />
        <Figure
          value={`${SESSION_MEDIAN} min`}
          label={`Median single session (mean ${SESSION_MEAN} min). Many sessions are one short exercise.`}
        />
      </div>

      <dl className="mt-6 space-y-1.5 text-sm text-zinc-400 light:text-zinc-600">
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-300 light:text-zinc-900">Sample:</dt>
          <dd>
            {SESSIONS} completed practice sessions logged by {PLAYERS} players,
            grouped into {PRACTICE_DAYS} practice days; measured {MEASURED_ON}.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-300 light:text-zinc-900">Practice day:</dt>
          <dd>
            all the time one player logged on one calendar day (UTC), across
            however many sessions that took.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-300 light:text-zinc-900">Caveat:</dt>
          <dd>
            durations are what players logged, including hand-entered reports, so
            the long tail (a few hundred sessions over four hours) is noisy. The
            medians are barely affected by it; the mean is.
          </dd>
        </div>
      </dl>
    </div>
  );
};
