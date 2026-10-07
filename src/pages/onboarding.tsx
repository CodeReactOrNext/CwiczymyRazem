import OnboardingView from "feature/onboarding/view";
import { LocalizedRegion } from "lib/i18n/LocalizedRegion";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

const OnboardingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Welcome to Riff Quest · Quick setup</title>
        <meta
          name='description'
          content='Tell us what you came for — exercise plans, songs, roadmaps or a practice log — and start there.'
        />
        <meta name='robots' content='noindex' />
      </Head>
      {/* Behind login and noindex, so it follows the player's language like the app. */}
      <LocalizedRegion>
        <OnboardingView />
      </LocalizedRegion>
    </>
  );
};

export default OnboardingPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "toast"],
});
