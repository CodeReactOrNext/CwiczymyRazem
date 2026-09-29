import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import type { QuestionOption } from "lib/roadmaps/generation/questionBank";
import { Check } from "lucide-react";

interface QuestionScreenProps {
  question: string;
  hint?: string;
  options: QuestionOption[];
  multi: boolean;
  values: string[];
  onChange: (values: string[]) => void;
}

/**
 * One question, its options as cards. Single choice replaces; multiple
 * toggles. The cards carry their own hint so the choice is explained where it
 * is made, not in a paragraph above.
 */
export const QuestionScreen = ({
  question,
  hint,
  options,
  multi,
  values,
  onChange,
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
    <div className='space-y-6'>
      <div className='space-y-1.5'>
        <h3 className='text-lg font-bold text-zinc-100'>{question}</h3>
        {hint && <p className='text-sm text-zinc-400'>{hint}</p>}
      </div>

      <div
        role={multi ? "group" : "radiogroup"}
        className='grid gap-2 sm:grid-cols-2'>
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
                "flex items-start gap-3 rounded-lg px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500",
                selected
                  ? "bg-zinc-700 text-zinc-50"
                  : "bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800",
              )}>
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
                  multi ? "rounded" : "rounded-full",
                  selected
                    ? "bg-amber-400 text-zinc-950"
                    : "bg-zinc-700/80 text-transparent",
                )}>
                <Check size={12} strokeWidth={3} />
              </span>
              <span className='min-w-0'>
                <span className='block text-sm font-semibold'>
                  {option.label}
                </span>
                {option.hint && (
                  <span
                    className={cn(
                      "mt-0.5 block text-xs leading-relaxed",
                      selected ? "text-zinc-300" : "text-zinc-500",
                    )}>
                    {option.hint}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
