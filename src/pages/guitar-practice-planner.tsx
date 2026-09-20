import type { GuitarPracticePlannerPageProps } from "feature/landing/GuitarPracticePlannerPage";
import { GuitarPracticePlannerPage } from "feature/landing/GuitarPracticePlannerPage";
import { buildGuitarPracticePlannerProps } from "feature/landing/lib/practicePlannerProps";
import type { GetStaticProps } from "next";

const GuitarPracticePlanner = (props: GuitarPracticePlannerPageProps) => (
  <GuitarPracticePlannerPage {...props} />
);

export const getStaticProps: GetStaticProps<
  GuitarPracticePlannerPageProps
> = async () => ({ props: buildGuitarPracticePlannerProps() });

export default GuitarPracticePlanner;
