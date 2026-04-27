import { memo, type ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { FaInfoCircle, FaLightbulb } from "react-icons/fa";

import type { Exercise } from "../../../types/exercise.types";

interface ExerciseInfoGridProps {
  exercise: Exercise;
  isPlayalong?: boolean;
  hasMetronome: boolean;
  children: ReactNode;
}

export const ExerciseInfoGrid = memo(function ExerciseInfoGrid({ exercise, isPlayalong, hasMetronome, children }: ExerciseInfoGridProps) {
  const { t } = useTranslation(["exercises"]);

  const instructionsNode = exercise.instructions && exercise.instructions.length > 0 && (
    <Accordion type="single" collapsible defaultValue="instructions" className="w-full">
      <AccordionItem value="instructions" className="border-none rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/5">
        <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
              <FaInfoCircle />
            </div>
            <span className="font-bold tracking-wide">{t("exercises:instructions")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2">
          <div className={cn(
            "prose prose-invert max-w-none",
            isPlayalong && "text-sm leading-relaxed opacity-70"
          )}>
            {exercise.instructions.map((instruction, idx) => (
              <p key={idx} className="mb-4 last:mb-0">{instruction}</p>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const tipsNode = exercise.tips && exercise.tips.length > 0 && (
    <Accordion type="single" collapsible defaultValue="tips" className="w-full">
      <AccordionItem value="tips" className="border-none rounded-2xl overflow-hidden bg-zinc-900/40 border border-white/5">
        <AccordionTrigger className="px-6 py-4 hover:bg-white/5 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <FaLightbulb />
            </div>
            <span className="font-bold tracking-wide">{t("exercises:hints")}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-2">
          <ul className={cn(
            "list-inside list-disc",
            isPlayalong ? "space-y-1 text-sm" : "space-y-2"
          )}>
            {exercise.tips.map((tip, idx) => (
              <li key={idx} className="marker:text-amber-500/50">{tip}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 w-full max-w-[1800px] mx-auto items-start">
      {hasMetronome ? (
        <div className="w-full flex flex-col gap-6 lg:col-span-4">
          {instructionsNode}
          {tipsNode}
        </div>
      ) : (
        <>
          {instructionsNode && (
            <div className={cn("w-full flex flex-col", !exercise.tips?.length ? "lg:col-span-9" : "lg:col-span-5")}>
              {instructionsNode}
            </div>
          )}
          {tipsNode && (
            <div className={cn("w-full flex flex-col", !exercise.instructions?.length ? "lg:col-span-9" : "lg:col-span-4")}>
              {tipsNode}
            </div>
          )}
        </>
      )}
      {children}
    </div>
  );
});
