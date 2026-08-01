"use client";

import { cn } from "assets/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";

import type { SongGuide } from "../types";
import { GuideSection } from "./GuideSection";

interface GuidePracticePlanProps {
  guide: SongGuide;
}

export const GuidePracticePlan = ({ guide }: GuidePracticePlanProps) => {
  // Local-only tick state — a nice-to-have "mark it done while I read" feel,
  // not synced anywhere, so it resets on refresh (no account/progress model
  // backs this page).
  const [checked, setChecked] = useState<boolean[]>(() =>
    guide.practicePlan.steps.map(() => false)
  );

  const toggle = (index: number) => {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };

  return (
    <GuideSection
      heading={guide.practicePlan.heading}
      intro={guide.practicePlan.intro}>
      <ol className='space-y-3'>
        {guide.practicePlan.steps.map((step, index) => {
          const isChecked = checked[index];

          return (
            <li key={step.slice(0, 32)}>
              <button
                type='button'
                onClick={() => toggle(index)}
                aria-pressed={isChecked}
                className='flex w-full items-start gap-4 rounded-lg bg-zinc-900/40 p-5 text-left transition-background hover:bg-zinc-900/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400'>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
                    isChecked ? "bg-cyan-500" : "bg-zinc-800"
                  )}>
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 transition-opacity",
                      isChecked ? "text-zinc-950 opacity-100" : "opacity-0"
                    )}
                    strokeWidth={3}
                    aria-hidden='true'
                  />
                </span>
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-colors",
                    isChecked ? "text-zinc-500 line-through" : "text-zinc-300"
                  )}>
                  {step}
                </p>
              </button>
            </li>
          );
        })}
      </ol>
    </GuideSection>
  );
};
