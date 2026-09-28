import type { GuitarLearningPathPageProps } from "feature/landing/GuitarLearningPathPage";
import { GuitarLearningPathPage } from "feature/landing/GuitarLearningPathPage";
import { buildGuitarLearningPathProps } from "feature/landing/lib/learningPathProps";
import type { GetStaticProps } from "next";

const GuitarLearningPath = (props: GuitarLearningPathPageProps) => (
  <GuitarLearningPathPage {...props} />
);

export const getStaticProps: GetStaticProps<
  GuitarLearningPathPageProps
> = async () => ({ props: buildGuitarLearningPathProps() });

export default GuitarLearningPath;
