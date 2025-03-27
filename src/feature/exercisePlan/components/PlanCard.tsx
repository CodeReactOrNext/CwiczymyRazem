import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { FaClock, FaListUl } from "react-icons/fa";

import type { DifficultyLevel, ExercisePlan } from "../types/exercise.types";

interface PlanCardProps {
  plan: ExercisePlan;
  onSelect?: () => void;
  onStart?: () => void;
  startButtonText?: string;
}

const planGradients = {
  technique:
    "from-blue-500/30 via-blue-500/10 to-indigo-500/30 hover:from-blue-500/40 hover:to-indigo-500/40",
  theory:
    "from-emerald-500/30 via-emerald-500/10 to-green-500/30 hover:from-emerald-500/40 hover:to-green-500/40",
  creativity:
    "from-purple-500/30 via-purple-500/10 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40",
  hearing:
    "from-orange-500/30 via-orange-500/10 to-amber-500/30 hover:from-orange-500/40 hover:to-amber-500/40",
  mixed:
    "from-red-500/30 via-red-500/10 to-yellow-500/30 hover:from-red-500/40 hover:to-yellow-500/40",
};

export const PlanCard = ({
  plan,
  onSelect,
  onStart,
  startButtonText,
}: PlanCardProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);

  const title =
    typeof plan.title === "string"
      ? plan.title
      : plan.title?.[i18n.language as keyof typeof plan.title] ||
        plan.title?.pl;
  const description =
    typeof plan.description === "string"
      ? plan.description
      : plan.description?.[i18n.language as keyof typeof plan.description] ||
        plan.description?.pl;

  const totalDuration = plan.exercises.reduce(
    (acc, exercise) => acc + exercise.timeInMinutes,
    0
  );

  const difficulty = ((plan as any).difficulty || "beginner") as
    | DifficultyLevel
    | "beginner";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-md",
        "cursor-pointer border border-border/40",
        "bg-gradient-to-br",
        planGradients[plan.category]
      )}
      onClick={onSelect}>
      {plan.image && (
        <div className='relative h-40 overflow-hidden'>
          <Image
            src={plan.image.src}
            alt=''
            fill
            className='object-cover object-center'
            aria-hidden='true'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-transparent to-background' />

          {/* Badges positioned within the image area */}
          <div className='absolute left-3 top-3'>
            <Badge
              variant='outline'
              className='rounded-full bg-background/40 px-3 py-1 text-xs backdrop-blur-sm'>
              {t(`exercises:categories.${plan.category}` as any)}
            </Badge>
          </div>

          <div className='absolute right-3 top-3'>
            <Badge
              variant='outline'
              className='rounded-full bg-background/40 px-3 py-1 text-xs backdrop-blur-sm'>
              {t(`exercises:difficulty.${difficulty}` as any)}
            </Badge>
          </div>
        </div>
      )}

      {!plan.image && (
        <div className='flex justify-between p-3'>
          <Badge
            variant='outline'
            className='rounded-full bg-background/40 px-3 py-1 text-xs backdrop-blur-sm'>
            {t(`exercises:categories.${plan.category}` as any)}
          </Badge>
          <Badge
            variant='outline'
            className='rounded-full bg-background/40 px-3 py-1 text-xs backdrop-blur-sm'>
            {t(`exercises:difficulty.${difficulty}` as any)}
          </Badge>
        </div>
      )}

      <div className='relative p-5'>
        <div>
          <h3 className='text-xl font-semibold text-foreground'>{title}</h3>
          <p className='mt-2 text-sm text-foreground/90'>{description}</p>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2 text-sm text-foreground/80'>
            <FaClock className='h-4 w-4' />
            <span>{totalDuration} min</span>
          </div>
          <div className='flex items-center gap-2 text-sm text-foreground/80'>
            <FaListUl className='h-4 w-4' />
            <span>
              {plan.exercises.length} {t("exercises:common.exercises")}
            </span>
          </div>
        </div>

        {onStart && (
          <Button
            className='mt-4 w-full shadow-sm'
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}>
            {startButtonText || t("common:start")}
          </Button>
        )}
      </div>
    </Card>
  );
};
