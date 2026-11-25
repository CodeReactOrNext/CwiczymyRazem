import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { DIFFICULTY_LEVELS,DifficultyBars } from "feature/exercisePlan/components/DifficultyBars";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import { ExternalLink, GraduationCap, Heart, InfoIcon, Lightbulb, ListOrdered } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

import type { Exercise } from "../../../types/exercise.types";

interface ExerciseInstructionsInlineProps {
  exercise: Exercise;
  rewardSkillId?: string;
  rewardAmount?: number;
}

const CATEGORY_IDS = ["technique", "theory", "hearing", "creativity"];

const DIFFICULTY_POINTS: Record<string, number> = { beginner: 1, easy: 1, medium: 2, hard: 3 };


const skillLabel = (id: string) => {
  const spaced = id.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const linkIcon = (url: string): ComponentType<{ className?: string }> => {
  if (url.includes("facebook")) return FaFacebook;
  if (url.includes("instagram")) return FaInstagram;
  if (url.includes("twitter") || url.includes("x.com")) return FaTwitter;
  if (url.includes("patreon")) return Heart;
  return ExternalLink;
};

const Heading = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <h4 className='flex items-center gap-2 text-[15px] font-semibold text-zinc-100'>
    <span aria-hidden className='text-zinc-400 [&_svg]:h-4 [&_svg]:w-4'>
      {icon}
    </span>
    {children}
  </h4>
);

/** A numbered line: the number on a small tile of its own, the line read beside it. */
const NumberedList = ({ items, tone }: { items: string[]; tone: "plain" | "tip" }) => (
  <ol className='flex flex-col gap-2.5'>
    {items.map((item, index) => (
      <li key={index} className='flex gap-3 text-sm leading-relaxed'>
        <span
          aria-hidden
          className={cn(
            "mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
            tone === "tip" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-300",
          )}>
          {index + 1}
        </span>
        <p className='text-zinc-300'>{item}</p>
      </li>
    ))}
  </ol>
);

/** A quiet label over a value on the reward tile. */
const TileLabel = ({ children }: { children: ReactNode }) => (
  <span className='text-xs font-medium text-zinc-500'>{children}</span>
);

/**
 * What the exercise asks for, under the tab: how to play it and why, the tips,
 * and what it pays. Three columns read left to right, each led by a heading
 * the size of the text under it.
 */
export const ExerciseInstructionsInline = ({ exercise, rewardSkillId, rewardAmount }: ExerciseInstructionsInlineProps) => {
  const { t } = useTranslation(["skills", "session"]);
  const steps = exercise.instructions ?? [];
  const tips = exercise.isPlayalong ? [] : (exercise.tips ?? []);
  const links = exercise.links ?? [];

  // A song item pays no skill points — its time goes to the song (see
  // planSongPractice) — so it must not advertise a reward it never grants.
  const points = exercise.songData ? 0 : rewardAmount || DIFFICULTY_POINTS[exercise.difficulty] || 0;
  const skillIds = rewardSkillId
    ? [rewardSkillId]
    : exercise.relatedSkills?.length
      ? exercise.relatedSkills
      : [exercise.category];
  const skillName = (id: string) => {
    if (CATEGORY_IDS.includes(id)) {
      const category = t(`categories.${id}`);
      if (category !== `categories.${id}`) return category;
    }
    const name = t(`skills.${id}.name`);
    if (name !== `skills.${id}.name`) return name;
    return t(`session:instructions.skill_labels.${id}`, guitarSkills.find((skill) => skill.id === id)?.name ?? skillLabel(id));
  };
  const difficulty = DIFFICULTY_LEVELS[exercise.difficulty];

  const hasRead = steps.length > 0 || !!exercise.whyItMatters;
  const hasTips = tips.length > 0 || (!!exercise.requiresBackingTrack && !exercise.isPlayalong);
  if (!hasRead && !hasTips && points === 0 && links.length === 0) return null;

  return (
    <div className='mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-x-14 gap-y-8 px-6 pb-9 pt-8 text-left md:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.15fr)_minmax(0,0.7fr)]'>
      <div className='flex flex-col gap-7'>
        {steps.length > 0 && (
          <section className='flex flex-col gap-3'>
            <Heading icon={<ListOrdered />}>{t("session:instructions.instructions")}</Heading>
            <NumberedList items={steps} tone='plain' />
          </section>
        )}
        {exercise.whyItMatters && (
          <section className='flex flex-col gap-2.5'>
            <Heading icon={<GraduationCap />}>{t("session:instructions.why")}</Heading>
            <p className='max-w-[60ch] text-sm leading-relaxed text-zinc-400'>{exercise.whyItMatters}</p>
          </section>
        )}
      </div>

      <div className='flex flex-col gap-5'>
        {exercise.requiresBackingTrack && !exercise.isPlayalong && (
          <p className='flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium leading-relaxed text-amber-400'>
            <InfoIcon className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
            {t("session:instructions.backing_hint")}
          </p>
        )}
        {tips.length > 0 && (
          <section className='flex flex-col gap-3'>
            <Heading icon={<Lightbulb className='text-amber-400' />}>{t("session:instructions.pro_tips")}</Heading>
            <NumberedList items={tips} tone='tip' />
          </section>
        )}
      </div>

      <div className='flex flex-col gap-5'>
        {/* What it is and what it pays, on one quiet tile — set apart by its
            ground, not a line. */}
        {points > 0 && (
          <div className='flex flex-col gap-4 rounded-xl bg-zinc-800/40 px-5 py-4'>
            {difficulty && (
              <section className='flex flex-col gap-1.5'>
                <TileLabel>{t("session:instructions.difficulty")}</TileLabel>
                <div className='flex items-center gap-2'>
                  <DifficultyBars difficulty={exercise.difficulty} />
                  <span className={cn("text-[15px] font-semibold capitalize", difficulty.text)}>{exercise.difficulty}</span>
                </div>
              </section>
            )}

            <section className='flex flex-col gap-1.5'>
              <TileLabel>{t("session:instructions.reward")}</TileLabel>
              <ul className='flex flex-col gap-1'>
                {skillIds.map((id) => (
                  <li key={id} className='flex items-center gap-2.5 text-sm text-zinc-300'>
                    <span className='w-7 shrink-0 pt-1 font-teko text-2xl font-semibold leading-none text-emerald-400'>
                      +{points}
                    </span>
                    <span>{skillName(id)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {links.length > 0 && (
          <section className='flex flex-col gap-2'>
            <Heading icon={<Heart className='text-red-400' />}>{t("session:instructions.support_author")}</Heading>
            <div className='flex flex-col items-start gap-2'>
              {links.map((link) => {
                const Icon = linkIcon(link.url);
                return (
                  <Button key={link.url} asChild variant='secondary' size='sm'>
                    <a href={link.url} target='_blank' rel='noopener noreferrer'>
                      <Icon className={cn(link.url.includes("patreon") && "text-red-500")} />
                      {link.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
