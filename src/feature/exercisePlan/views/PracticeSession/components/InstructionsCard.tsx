import { Card } from "assets/components/ui/card";
import { i18n } from "next-i18next";

import type { LocalizedContent } from "../../../types/exercise.types";

interface InstructionsCardProps {
  instructions: Array<LocalizedContent>;
  title: string;
}

export const InstructionsCard = ({
  instructions,
  title,
}: InstructionsCardProps) => {
  const currentLang = i18n?.language as keyof LocalizedContent;

  return (
    <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
      <div className='border-b border-border/50 bg-muted/10 p-3'>
        <h3 className='text-base font-medium tracking-tight'>{title}</h3>
      </div>
      <div className='space-y-3 p-4'>
        {instructions.map((instruction, index) => (
          <div
            key={index}
            className='flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground'>
            <span className='mt-[7px] flex h-2 w-2 flex-shrink-0 rounded-full bg-primary/80' />
            <span className='[&>strong]:font-medium [&>strong]:text-foreground'>
              {instruction[currentLang]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
