import type { SeoLandingPageProps } from "feature/seoLanding/components/SeoLandingPage";
import { SeoLandingPage } from "feature/seoLanding/components/SeoLandingPage";
import { guitarScaleRoutineConfig } from "feature/seoLanding/content";
import { buildSeoLandingProps } from "feature/seoLanding/lib/buildSeoLandingProps";
import type { GetStaticProps } from "next";

const GuitarScaleRoutinePage = (props: SeoLandingPageProps) => (
  <SeoLandingPage {...props} />
);

export const getStaticProps: GetStaticProps<SeoLandingPageProps> = async () => ({
  props: buildSeoLandingProps(guitarScaleRoutineConfig),
});

export default GuitarScaleRoutinePage;
