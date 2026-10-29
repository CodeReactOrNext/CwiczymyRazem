import { CompetitionPage } from "feature/landing/CompetitionPage";
import type { CompetitionPageProps } from "feature/landing/lib/competitionProps";
import { buildCompetitionProps } from "feature/landing/lib/competitionProps";
import type { GetStaticProps } from "next";

const GuitarPracticeLeaderboard = (props: CompetitionPageProps) => (
  <CompetitionPage {...props} />
);

export const getStaticProps: GetStaticProps<
  CompetitionPageProps
> = async () => ({ props: buildCompetitionProps() });

export default GuitarPracticeLeaderboard;
