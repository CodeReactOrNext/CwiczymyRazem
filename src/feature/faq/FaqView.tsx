import type {
  faqGroupInterface,
  faqQuestionInterface,
} from "feature/faq/components/FaqLayout";
import { FaqLayout } from "feature/faq/components/FaqLayout";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";

/**
 * Shared with the FAQPage JSON-LD in pages/faq/index.tsx so the structured
 * data and the rendered answers can never drift out of sync.
 */
export const useFaqGroups = (): faqGroupInterface[] => {
  const { t } = useTranslation("faq");

  const question = (key: string): faqQuestionInterface => ({
    title: t(`${key}_title`),
    message: t(`${key}_description`),
  });

  return [
    {
      section: t("group_start"),
      questions: [
        question("about"),
        question("price"),
        question("account"),
        question("beginner"),
        question("equipment"),
      ],
    },
    {
      section: t("group_practice"),
      questions: [
        question("how_its_work"),
        question("late_log"),
        question("about_excerise"),
        question("content"),
        question("desktop"),
      ],
    },
    {
      section: t("group_progress"),
      questions: [
        question("about_points"),
        question("points_rate"),
        question("streak_break"),
        question("several_times_repotr"),
        question("fame"),
        question("get_achievement"),
      ],
    },
    {
      section: t("group_community"),
      questions: [
        question("songs"),
        question("leaderboard"),
        question("challenges"),
      ],
    },
  ];
};

export const useFaqQuestions = (): faqQuestionInterface[] =>
  useFaqGroups().flatMap((group) => group.questions);

const FaqView = () => {
  const { t } = useTranslation("faq");
  const groups = useFaqGroups();

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 p-4 font-openSans md:p-8'>
      <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
        <h1 className='text-2xl font-bold text-zinc-100 md:text-4xl'>
          {t("faq")}
        </h1>
        <p className='mt-6 max-w-2xl text-base leading-relaxed text-zinc-300'>
          {t("intro_lead")}
        </p>
        <p className='mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {t("intro_body")}
        </p>
      </div>

      <FaqLayout groups={groups} />

      <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
        <h2 className='text-lg font-bold text-zinc-100'>{t("outro_title")}</h2>
        <p className='mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {t("outro_body")}
        </p>
        <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
          <Link
            href='/wiki'
            className='text-cyan-400 transition-colors hover:text-cyan-300'>
            Browse the knowledge base
          </Link>
          <Link
            href='/contact'
            className='text-cyan-400 transition-colors hover:text-cyan-300'>
            Contact us
          </Link>
          <Link
            href='/blog'
            className='text-cyan-400 transition-colors hover:text-cyan-300'>
            Read the practice guides
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FaqView;
