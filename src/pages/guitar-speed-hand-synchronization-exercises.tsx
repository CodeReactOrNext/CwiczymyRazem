import type { SeoLandingPageProps } from "feature/seoLanding/components/SeoLandingPage";
import { SeoLandingPage } from "feature/seoLanding/components/SeoLandingPage";
import { guitarSpeedHandSyncConfig } from "feature/seoLanding/content";
import { buildSeoLandingProps } from "feature/seoLanding/lib/buildSeoLandingProps";
import type { GetStaticProps } from "next";

const GuitarSpeedHandSyncPage = (props: SeoLandingPageProps) => (
  <SeoLandingPage {...props} />
);

export const getStaticProps: GetStaticProps<SeoLandingPageProps> = async () => ({
  props: buildSeoLandingProps(guitarSpeedHandSyncConfig),
});

export default GuitarSpeedHandSyncPage;
