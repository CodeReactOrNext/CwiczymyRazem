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
    <div className="my-10 overflow-hidden rounded-lg bg-zinc-900/30 light:bg-zinc-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto sm:table-fixed">
          <thead>
            <tr className="bg-white/5 light:bg-zinc-200/60">
              <th className="px-4 py-3 text-xs font-bold text-cyan-400 light:text-cyan-700">Segment</th>
              <th className="px-4 py-3 text-xs font-bold text-cyan-400 light:text-cyan-700">Duration</th>
              <th className="px-4 py-3 text-xs font-bold text-cyan-400 light:text-cyan-700">Focus</th>
            </tr>
          </thead>
          <tbody>
            {defaultSteps.map((step, index) => (
              <tr key={index} className="transition-colors hover:bg-white/[0.02] light:hover:bg-zinc-200/40">
                <td className="px-4 py-4 font-bold text-white align-top light:text-zinc-900">
                  {step.segment}
                </td>
                <td className="px-4 py-4 text-sm text-zinc-300 whitespace-nowrap light:text-zinc-700 align-top">
                  {step.duration}
                </td>
                <td className="px-4 py-4 text-sm text-zinc-400 leading-relaxed light:text-zinc-600">
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
