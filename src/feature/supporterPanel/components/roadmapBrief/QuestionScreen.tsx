import { cn } from "assets/lib/utils";
import { BuilderHeading } from "feature/supporterPanel/components/roadmapBrief/BuilderFrame";
import { motion } from "framer-motion";
import type { QuestionOption } from "lib/roadmaps/generation/questionBank";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface QuestionScreenProps {
  question: string;
  hint?: string;
  options: QuestionOption[];
  multi: boolean;
  values: string[];
  onChange: (values: string[]) => void;
  /** Something at the far end of an option's row — what picking it costs. */
  renderTrailing?: (option: QuestionOption) => ReactNode;
}

/**
 * One question, its options as a list of rows. Single choice replaces;
 * multiple toggles. The rows carry their own hint so the choice is explained
 * where it is made, not in a paragraph above.
 */
export const QuestionScreen = ({
  question,
  hint,
  options,
  multi,
  values,
  onChange,
  renderTrailing,
}: QuestionScreenProps) => {
  const toggle = (value: string) => {
    if (!multi) {
      onChange([value]);
      return;
    }
    onChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  return (
    <div className='space-y-7'>
      <BuilderHeading title={question} hint={hint} />

      <div
        role={multi ? "group" : "radiogroup"}
        aria-label={question}
        className='grid gap-2.5'>
        {options.map((option, index) => {
          const selected = values.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type='button'
              role={multi ? "checkbox" : "radio"}
              aria-checked={selected}
              onClick={() => toggle(option.value)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3.5 rounded-lg border-b-[3px] px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                selected
                  ? "border-b-black/30 bg-zinc-700 text-zinc-50"
                  : "border-b-transparent bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800",
              )}>
              <span
                className={cn(
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center transition-colors",
                  multi ? "rounded" : "rounded-full",
                  selected
                    ? "bg-amber-400 text-zinc-950"
                    : "bg-zinc-700/80 text-transparent",
                )}>
                <Check size={12} strokeWidth={3.5} />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-base font-semibold'>
                  {option.label}
                </span>
                {option.hint && (
                  <span
                    className={cn(
                      "mt-0.5 block text-sm leading-relaxed",
                      selected ? "text-zinc-300" : "text-zinc-400",
                    )}>
                    {option.hint}
                  </span>
                )}
              </span>
              {renderTrailing?.(option)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
