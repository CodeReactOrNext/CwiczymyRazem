import { Badge } from "assets/components/ui/badge";
import { Card } from "assets/components/ui/card";
import { Separator } from "assets/components/ui/separator";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaClock, FaGuitar, FaLightbulb, FaList } from "react-icons/fa";

import type { Exercise } from "../../types/exercise.types";

interface ExerciseDetailsProps {
  exercise: Exercise;
}

export const ExerciseDetails = ({ exercise }: ExerciseDetailsProps) => {
  const { t, i18n } = useTranslation("exercises");
  const currentLang = i18n.language as "pl" | "en";

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Card className='p-6'>
        <div className='space-y-6'>
          <div className='flex items-start justify-between'>
            <div>
              <h3 className='text-2xl font-bold'>
                {exercise.title[currentLang]}
              </h3>
              <p className='text-muted-foreground'>
                {exercise.description[currentLang]}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <FaClock className='text-muted-foreground' />
              <span>
                {t("common.duration", { minutes: exercise.timeInMinutes })}
              </span>
            </div>
          </div>

          <div>
            <h4 className='mb-2 text-sm font-semibold'>
              {t("exercise.focus_areas")}
            </h4>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='secondary'>
                {t(`categories.${exercise.category}`)}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className='mb-2 text-sm font-semibold'>
              {t("exercise.category")}
            </h4>
            <Badge variant='default' className='capitalize'>
              {t(`categories.${exercise.category}`)}
            </Badge>

            <h4 className='mb-2 mt-4 text-sm font-semibold'>
              {t("exercise.related_skills")}
            </h4>
            <div className='flex flex-wrap gap-2'>
              {skills.map(
                (skill) =>
                  skill && (
                    <Badge
                      key={skill.id}
                      variant='secondary'
                      className='flex items-center gap-1'>
                      {skill.icon && <skill.icon className='h-3 w-3' />}
                      <span>{t(`common:skills.${skill.id}` as any)}</span>
                    </Badge>
                  )
              )}
            </div>
          </div>

          <Separator />

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-lg font-semibold'>
              <FaList />
              <h4>{t("exercise.instructions")}</h4>
            </div>
            <ul className='list-disc space-y-2 pl-5'>
              {exercise.instructions.map((instruction, index) => (
                <li key={index}>{instruction[currentLang]}</li>
              ))}
            </ul>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-lg font-semibold'>
              <FaLightbulb />
              <h4>{t("exercise.tips")}</h4>
            </div>
            <ul className='list-disc space-y-2 pl-5'>
              {exercise.tips.map((tip, index) => (
                <li key={index}>{tip[currentLang]}</li>
              ))}
            </ul>
          </div>

          {exercise.metronomeSpeed && (
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-lg font-semibold'>
                <FaGuitar />
                <h4>{t("exercise.practice_speed")}</h4>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>
                    {t("exercise.start_at")}
                  </p>
                  <p className='text-xl font-bold'>
                    {exercise.metronomeSpeed.min} {t("exercise.bpm")}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>
                    {t("exercise.target")}
                  </p>
                  <p className='text-xl font-bold'>
                    {exercise.metronomeSpeed.recommended} {t("exercise.bpm")}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-muted-foreground'>
                    {t("exercise.max")}
                  </p>
                  <p className='text-xl font-bold'>
                    {exercise.metronomeSpeed.max} {t("exercise.bpm")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
