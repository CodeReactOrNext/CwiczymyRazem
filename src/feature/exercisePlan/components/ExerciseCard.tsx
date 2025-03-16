import { Badge } from "assets/components/ui/badge";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { ExerciseDetailsDialog } from "feature/exercisePlan/components/ExerciseDetailsDialog/ExerciseDetailsDialog";
import type {
  Exercise,
  LocalizedContent,
} from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaClock } from "react-icons/fa";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: () => void;
}

const categoryGradients = {
  technique:
    "from-blue-500/5 via-transparent to-indigo-500/5 hover:from-blue-500/15 hover:to-indigo-500/10",
  theory:
    "from-emerald-500/5 via-transparent to-green-500/5 hover:from-emerald-500/15 hover:to-green-500/10",
  creativity:
    "from-purple-500/5 via-transparent to-pink-500/5 hover:from-purple-500/15 hover:to-pink-500/10",
  hearing:
    "from-orange-500/5 via-transparent to-amber-500/5 hover:from-orange-500/15 hover:to-amber-500/10",
};

export const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);
  const currentLang = i18n.language as keyof LocalizedContent;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const exerciseSkills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((skill) => skill.id === skillId))
    .filter(Boolean);

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-md",
          "cursor-pointer border border-border/40",
          "before:absolute before:inset-0 before:bg-gradient-to-br",
          categoryGradients[exercise.category]
        )}
        onClick={() => setIsDetailsOpen(true)}>
        <div className='relative z-10 p-6'>
          <div className='flex justify-between'>
            <Badge variant='outline' className='rounded-full px-3 py-1 text-xs'>
              {t(`exercises:categories.${exercise.category}`)}
            </Badge>
            <Badge variant='outline' className='rounded-full text-xs'>
              {t(`exercises:difficulty.${exercise.difficulty}` as any)}
            </Badge>
          </div>

          <div className='mt-4'>
            <h3 className='text-xl font-semibold'>
              {exercise.title[currentLang]}
            </h3>
            <p className='mt-2 text-sm text-muted-foreground/80'>
              {exercise.description[currentLang]}
            </p>
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            {exerciseSkills.map(
              (skill) =>
                skill && (
                  <Badge
                    key={skill.id}
                    variant='secondary'
                    className={cn("flex items-center gap-1")}>
                    {skill.icon && <skill.icon className='h-3 w-3' />}
                    {t(`common:skills.${skill.id}` as any)}
                  </Badge>
                )
            )}
          </div>

          <div className='mt-4 flex items-center gap-2 text-sm text-muted-foreground/70'>
            <FaClock className='h-4 w-4' />
            <span>{exercise.timeInMinutes} min</span>
          </div>
        </div>
      </Card>

      <ExerciseDetailsDialog
        exercise={exercise}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};
