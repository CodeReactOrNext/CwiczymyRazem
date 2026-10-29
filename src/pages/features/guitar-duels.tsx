import { DuelsPage } from "feature/landing/DuelsPage";
import type { DuelsPageProps } from "feature/landing/lib/duelsProps";
import { buildDuelsProps } from "feature/landing/lib/duelsProps";
import type { GetStaticProps } from "next";

const GuitarDuels = (props: DuelsPageProps) => <DuelsPage {...props} />;

export const getStaticProps: GetStaticProps<DuelsPageProps> = async () => ({
  props: buildDuelsProps(),
});

export default GuitarDuels;
