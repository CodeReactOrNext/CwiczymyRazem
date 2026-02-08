import React from 'react';

interface PracticeStep {
  segment: string;
  duration: string;
  focus: string;
}

const defaultSteps: PracticeStep[] = [
  {
    segment: 'Warm-Up',
    duration: '2–3 Minutes',
    focus: 'Finger stretches, chromatic exercises, or basic chord switching'
  },
  {
    segment: 'Technique Drills',
    duration: '5 Minutes',
    focus: 'Scales, arpeggios, chord transitions, or specific skills like bends'
  },
  {
    segment: 'Song/Riff Practice',
    duration: '5–6 Minutes',
    focus: 'Applying techniques to music you love'
  },
  {
    segment: 'Cool-Down/Review',
    duration: '1–2 Minutes',
    focus: 'Reflecting on progress and logging your session'
  }
];

export const PracticeTable = () => {
  return (
    <div className="my-10 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/30">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto sm:table-fixed">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-xs font-bold tracking-wider text-cyan-400">Segment</th>
              <th className="px-4 py-3 text-xs font-bold tracking-wider text-cyan-400">Duration</th>
              <th className="px-4 py-3 text-xs font-bold tracking-wider text-cyan-400">Focus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {defaultSteps.map((step, index) => (
              <tr key={index} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-4 font-bold text-white align-top">
                  {step.segment}
                </td>
                <td className="px-4 py-4 text-sm text-zinc-300 whitespace-nowrap align-top">
                  {step.duration}
                </td>
                <td className="px-4 py-4 text-sm text-zinc-400 leading-relaxed">
                  {step.focus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
