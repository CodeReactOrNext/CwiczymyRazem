import { Card } from "assets/components/ui/card";
import { i18n } from "next-i18next";

import type { LocalizedContent } from "../../../types/exercise.types";

interface TipsCardProps {
  tips: Array<LocalizedContent>;
}

export const TipsCard = ({ tips }: TipsCardProps) => {
  const currentLang = i18n?.language as keyof LocalizedContent;

  return (
    <Card className='overflow-hidden rounded-xl border-border/30 bg-card/70 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg'>
      <div className='border-b border-border/50 bg-muted/10 p-3'>
        <h3 className='text-sm font-medium'>Wskazówki</h3>
      </div>
      <div className='p-4'>
        <ul className='space-y-2 text-sm'>
          {tips.map((tip, index) => (
            <li
              key={index}
              className='flex items-start gap-2 text-muted-foreground'>
              <span className='mt-0.5 text-primary'>💡</span>
              {tip[currentLang]}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
