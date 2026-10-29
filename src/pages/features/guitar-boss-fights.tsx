import { BossFightsPage } from "feature/landing/BossFightsPage";
import type { BossFightsPageProps } from "feature/landing/lib/bossFightsProps";
import { buildBossFightsProps } from "feature/landing/lib/bossFightsProps";
import type { GetStaticProps } from "next";

const GuitarBossFights = (props: BossFightsPageProps) => (
  <BossFightsPage {...props} />
);

export const getStaticProps: GetStaticProps<
  BossFightsPageProps
> = async () => ({
  props: buildBossFightsProps(),
});

export default GuitarBossFights;
