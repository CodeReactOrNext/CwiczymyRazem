import { Gauge } from "lucide-react";

import type { GuideCustomBlock as GuideCustomBlockType } from "../types";
import { DifficultyMeter } from "./DifficultyMeter";
import { GuideSection } from "./GuideSection";

interface GuideCustomBlockProps {
  block: GuideCustomBlockType;
}

export const GuideCustomBlock = ({ block }: GuideCustomBlockProps) => {
  switch (block.kind) {
    case "tempoLadder":
      return (
        <GuideSection heading={block.heading} intro={block.intro}>
          <div className='space-y-3'>
            {block.steps.map((step, index) => (
              <div
                key={step.bpm}
                className='flex flex-col gap-3 rounded-lg bg-zinc-900/40 p-5 sm:flex-row sm:items-center'>
                <div className='flex shrink-0 items-center gap-2 sm:w-40'>
                  <Gauge className='h-4 w-4 text-orange-400' />
                  <span className='font-display text-2xl font-bold text-orange-400'>
                    {step.bpm}
                  </span>
                  <span className='text-xs text-zinc-500'>BPM</span>
                </div>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  <span className='mr-2 font-semibold text-zinc-300'>
                    Rung {index + 1}.
                  </span>
                  {step.goal}
                </p>
              </div>
            ))}
          </div>
        </GuideSection>
      );

    case "patternBreakdown":
      return (
        <GuideSection heading={block.heading} intro={block.intro}>
          <div className='grid gap-4 md:grid-cols-2'>
            {block.steps.map((step) => (
              <div key={step.label} className='rounded-lg bg-zinc-900/40 p-6'>
                <h3 className='mb-2 font-semibold text-cyan-400'>
                  {step.label}
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </GuideSection>
      );

    case "chordMap":
      return (
        <GuideSection heading={block.heading} intro={block.intro}>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {block.chords.map((chord, index) => (
              <div key={`${chord.name}-${index}`} className='rounded-lg bg-zinc-900/40 p-5'>
                <div className='mb-1 flex items-baseline justify-between gap-2'>
                  <span
                    translate='no'
                    className='font-display text-2xl font-bold text-zinc-100'>
                    {chord.name}
                  </span>
                  <span className='text-xs text-zinc-500'>#{index + 1}</span>
                </div>
                <p className='mb-3 text-xs font-medium text-cyan-400'>
                  {chord.shape}
                </p>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  {chord.tip}
                </p>
              </div>
            ))}
          </div>
        </GuideSection>
      );

    case "journey":
      return (
        <GuideSection heading={block.heading} intro={block.intro}>
          <div className='space-y-4'>
            {block.stages.map((stage) => {
              return (
                <div key={stage.name} className='rounded-lg bg-zinc-900/40 p-6'>
                  <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                    <h3 className='font-semibold text-zinc-100'>{stage.name}</h3>
                    <span className='text-xs tabular-nums text-zinc-500'>
                      {stage.timecode}
                    </span>
                  </div>
                  <div className='mb-3 max-w-xs'>
                    <DifficultyMeter value={stage.difficulty} showValue={false} />
                  </div>
                  <p className='mb-4 text-sm leading-relaxed text-zinc-400'>
                    {stage.description}
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {stage.techniques.map((technique) => (
                      <span
                        key={technique}
                        className='rounded bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400'>
                        {technique}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </GuideSection>
      );

    default:
      return null;
  }
};
