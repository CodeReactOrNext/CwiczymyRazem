import type { SeoLandingPageProps } from "feature/seoLanding/components/SeoLandingPage";
import { SeoLandingPage } from "feature/seoLanding/components/SeoLandingPage";
import { intermediateRoutineConfig } from "feature/seoLanding/content";
import { buildSeoLandingProps } from "feature/seoLanding/lib/buildSeoLandingProps";
import type { GetStaticProps } from "next";

const IntermediateRoutinePage = (props: SeoLandingPageProps) => (
  <SeoLandingPage {...props} />
);

export const getStaticProps: GetStaticProps<SeoLandingPageProps> = async () => ({
  props: buildSeoLandingProps(intermediateRoutineConfig),
});

export default IntermediateRoutinePage;
