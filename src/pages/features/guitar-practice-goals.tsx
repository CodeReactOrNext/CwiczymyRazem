import type { PracticeGoalsPageProps } from "feature/landing/lib/practiceGoalsProps";
import { buildPracticeGoalsProps } from "feature/landing/lib/practiceGoalsProps";
import { PracticeGoalsPage } from "feature/landing/PracticeGoalsPage";
import type { GetStaticProps } from "next";

const GuitarPracticeGoals = (props: PracticeGoalsPageProps) => (
  <PracticeGoalsPage {...props} />
);

export const getStaticProps: GetStaticProps<
  PracticeGoalsPageProps
> = async () => ({ props: buildPracticeGoalsProps() });

export default GuitarPracticeGoals;
