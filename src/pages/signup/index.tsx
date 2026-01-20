import SingupView from "feature/user/view/SingupView";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

const SignUpPage: NextPage = () => {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
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
