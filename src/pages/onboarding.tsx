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
          content='Set up Riff Quest in under a minute. Pick your level, your focus, and start tracking your guitar practice.'
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
