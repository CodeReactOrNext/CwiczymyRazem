import SingupView from "feature/user/view/SingupView";
import type { NextPage } from "next";
import Head from "next/head";
import { safeNextPath } from "utils/auth/safeNextPath";
import { withAuth } from "utils/auth/serverAuth";

const SignUpPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Start Free - Join Riff Quest Guitar Tracker</title>
        <meta name="description" content="Create your free Riff Quest account and start tracking guitar practice. No credit card required. Join thousands of guitarists leveling up." />
        {/* The form has no content worth ranking and `?next=` produces endless
            variants of it, so keep it out of the index and point every variant
            at the bare URL. */}
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://riff.quest/signup" />
      </Head>
      <SingupView />
    </>
  );
};

export default SignUpPage;

export const getServerSideProps = async (context: any) => {
  // Someone who is already signed in and arrived from a song card should land on
  // that song, not on a generic dashboard.
  const next = safeNextPath(context.query?.next);
  const result = await withAuth({
    redirectIfAuthenticated: next,
    translations: ["common", "signup", "yup_errors", "toast"],
  })(context);

  return result;
};
