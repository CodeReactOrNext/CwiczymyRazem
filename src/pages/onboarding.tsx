import OnboardingView from "feature/onboarding/view";
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
      <OnboardingView />
    </>
  );
};

export default OnboardingPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "toast"],
});
