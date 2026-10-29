import type { ProgressPageProps } from "feature/landing/lib/progressProps";
import { buildProgressProps } from "feature/landing/lib/progressProps";
import { ProgressPage } from "feature/landing/ProgressPage";
import type { GetStaticProps } from "next";

const GuitarProgressTracker = (props: ProgressPageProps) => (
  <ProgressPage {...props} />
);

export const getStaticProps: GetStaticProps<ProgressPageProps> = async () => ({
  props: buildProgressProps(),
});

export default GuitarProgressTracker;
