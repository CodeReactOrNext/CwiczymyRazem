import React from 'react';

/**
 * Replaces the old SessionLengthChart, which plotted a "15 min median" next to
 * a "54 min average" — two numbers from no stated sample, and the median was
 * never measured at all. The aggregate query behind `npm run update-hero-stats`
 * returns a session count and a summed duration and nothing else, so a mean is
 * the only session-length figure we can publish honestly. Everything below is
 * the last measured pass (see src/feature/landing/data/heroStats.ts).
 *
 * If a later pass measures a distribution, bring the chart back — with its
 * sample printed next to it.
 */
const MEASURED_ON = '24 August 2026';
const SESSIONS = '8,000+';
const PLAYERS = '2,800+';
const MEAN_MINUTES = 57;

export const SessionLengthStat = () => {
  return (
    <div className="not-prose my-10 rounded-lg bg-zinc-900/40 p-6">
      <p className="text-sm font-medium text-zinc-200">
        How long does a logged Riff Quest session actually run?
      </p>

      <p className="mt-6 text-5xl font-bold tracking-tight text-cyan-400">
        {MEAN_MINUTES} min
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        Mean length of a completed practice session.
      </p>

      <dl className="mt-6 space-y-1.5 text-xs text-zinc-500">
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-400">Sample:</dt>
          <dd>
            every completed practice report logged by {PLAYERS} players &mdash;{' '}
            {SESSIONS} sessions in total &mdash; measured {MEASURED_ON}.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-400">Unit:</dt>
          <dd>
            one logged session, not one person&apos;s day. Someone who practises
            twice on a Tuesday appears twice.
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-zinc-400">Duration:</dt>
          <dd>
            the total time recorded on that session, summed and divided by the
            session count.
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-xs leading-relaxed text-zinc-500">
        We publish the mean and nothing else because the mean is all the
        aggregate returns. There is no median here, and no split by skill level,
        because neither is measured &mdash; and a mean of this shape is easily
        pulled upward by a minority of long sessions, so read it as &ldquo;what
        the total divided by the count comes to&rdquo;, not as &ldquo;what a
        typical session looks like&rdquo;.
      </p>
    </div>
  );
};
