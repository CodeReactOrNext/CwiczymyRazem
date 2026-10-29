import { ArsenalPage } from "feature/landing/ArsenalPage";
import type { ArsenalPageProps } from "feature/landing/lib/arsenalProps";
import { buildArsenalProps } from "feature/landing/lib/arsenalProps";
import type { GetStaticProps } from "next";

const GuitarPracticeRewards = (props: ArsenalPageProps) => (
  <ArsenalPage {...props} />
);

export const getStaticProps: GetStaticProps<ArsenalPageProps> = async () => ({
  props: buildArsenalProps(),
});

export default GuitarPracticeRewards;
