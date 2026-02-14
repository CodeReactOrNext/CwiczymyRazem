import SingupView from "feature/user/view/SingupView";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

const SignUpPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Start Free - Join Riff Quest Guitar Tracker</title>
        <meta name="description" content="Create your free Riff Quest account and start tracking guitar practice. No credit card required. Join thousands of guitarists leveling up." />

      </Head>
      <SingupView />
    </>
  );
};

export default SignUpPage;

export const getServerSideProps = withAuth({
  redirectIfAuthenticated: "/dashboard",
  translations: ["common", "signup", "yup_errors", "toast"],
});
