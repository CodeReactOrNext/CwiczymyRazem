import { Badge } from "assets/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { i18n } from "next-i18next";

import type { LocalizedContent } from "../../../types/exercise.types";

interface NextExerciseCardProps {
  nextExercise: {
    title: LocalizedContent;
    image?: string | StaticImageData;
    timeInMinutes: number;
  } | null;
  isMobile?: boolean;
}

export const NextExerciseCard = ({
  nextExercise,
  isMobile = false,
}: NextExerciseCardProps) => {
  const currentLang = i18n?.language as keyof LocalizedContent;

  if (!nextExercise) return null;

  const formatTime = (timeInMinutes: number): string => {
    const minutes = Math.floor(timeInMinutes);
    return `${minutes} min`;
  };

  return (
    <Card
      className={`border-border/40 bg-card/30 backdrop-blur-sm ${
        isMobile ? "mb-4" : "h-full"
      }`}>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base font-medium'>
          Następne ćwiczenie
        </CardTitle>
      </CardHeader>
      <CardContent className='flex items-center gap-3 pb-4'>
        <div className='relative h-16 w-16 overflow-hidden rounded-lg border border-border/30'>
          {nextExercise.image ? (
            <Image
              src={nextExercise.image}
              alt={nextExercise.title[currentLang]}
              className='object-cover'
              fill
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground'>
              No img
            </div>
          )}
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <h4 className='text-sm font-medium leading-tight text-foreground'>
            {nextExercise.title[currentLang]}
          </h4>
          <Badge variant='secondary' className='w-fit text-xs'>
            {formatTime(nextExercise.timeInMinutes)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
