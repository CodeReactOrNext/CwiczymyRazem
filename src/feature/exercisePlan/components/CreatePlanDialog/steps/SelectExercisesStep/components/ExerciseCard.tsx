import { Badge } from "assets/components/ui/badge";
import { Card } from "assets/components/ui/card";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "react-i18next";
import { FaCheck, FaClock } from "react-icons/fa";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  currentLang: "pl" | "en";
  onToggle: (exercise: Exercise) => void;
}

export const ExerciseCard = ({
  exercise,
  isSelected,
  onToggle,
  currentLang,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["common"]);

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  const handleClick = () => onToggle(exercise);

  return (
    <Card
      key={exercise.id}
      className={`cursor-pointer transition-colors hover:bg-accent ${
        isSelected ? "border-primary bg-primary/5" : ""
      }`}
      onClick={handleClick}>
      <div className='relative p-4'>
        {isSelected && (
          <div className='absolute right-4 top-4'>
            <FaCheck className='h-4 w-4 text-primary' />
          </div>
        )}
        <h3 className='font-medium'>{exercise.title[currentLang]}</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          {exercise.description[currentLang]}
        </p>
        <div className='mb-4 mt-4 flex flex-wrap items-center gap-2'>
          <Badge variant='secondary'>
            {t(`common:categories.${exercise.category}`)}
          </Badge>
          <div className='flex min-w-4 items-center gap-1 text-sm text-muted-foreground'>
            <FaClock className='h-3 w-3' />
            <span>{exercise.timeInMinutes} min</span>
          </div>
        </div>
        {skills.map((skill) => (
          <Badge key={skill?.id} variant='outline' className='mr-2 text-xs'>
            {skill ? t(`common:skills.${skill.id}` as any) : ""}
          </Badge>
        ))}
      </div>
    </Card>
  );
};
