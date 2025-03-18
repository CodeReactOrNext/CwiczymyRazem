import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "react-i18next";
import { FaClock, FaListUl } from "react-icons/fa";

import type { ExercisePlan } from "../../types/exercise.types";

interface PlanCardProps {
  plan: ExercisePlan;
  onSelect?: () => void;
  onStart?: () => void;
}

const planGradients = {
  technique:
    "from-blue-500/5 via-transparent to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10",
  theory:
    "from-emerald-500/5 via-transparent to-green-500/5 hover:from-emerald-500/10 hover:to-green-500/10",
  creativity:
    "from-purple-500/5 via-transparent to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10",
  hearing:
    "from-orange-500/5 via-transparent to-amber-500/5 hover:from-orange-500/10 hover:to-amber-500/10",
  mixed:
    "from-red-500/5 via-transparent to-yellow-500/5 hover:from-red-500/10 hover:to-yellow-500/10",
};

export const PlanCard = ({ plan, onSelect, onStart }: PlanCardProps) => {
  const { t, i18n } = useTranslation("exercises");

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

  const difficulty = (plan as any).difficulty || "beginner";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-md",
        "cursor-pointer border border-border/40",
        "before:absolute before:inset-0 before:bg-gradient-to-br",
        planGradients[plan.category]
      )}
      onClick={onSelect}>
      <div className='relative z-10 p-6'>
        <div className='flex justify-between'>
          <Badge variant='outline' className='rounded-full px-3 py-1 text-xs'>
            {t(`categories.${plan.category}` as any)}
          </Badge>
          <Badge variant='outline' className='rounded-full text-xs'>
            {t(`difficulty.${difficulty}` as any)}
          </Badge>
        </div>

        <div className='mt-4'>
          <h3 className='text-xl font-semibold'>{title}</h3>
          <p className='mt-2 text-sm text-muted-foreground/80'>{description}</p>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground/70'>
            <FaClock className='h-4 w-4' />
            <span>{totalDuration} min</span>
          </div>
          <div className='flex items-center gap-2 text-sm text-muted-foreground/70'>
            <FaListUl className='h-4 w-4' />
            <span>
              {plan.exercises.length} {t("common.exercises")}
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
            {t("practice.start")}
          </Button>
        )}
      </div>
    </Card>
  );
};
