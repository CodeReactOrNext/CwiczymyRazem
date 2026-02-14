import LoginView from "feature/user/view/LoginView";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

const LoginPage: NextPage = () => {
    // If we're here, it means withAuth didn't redirect us elsewhere (e.g. to dashboard),
    // so we are not logged in (or withAuth isn't used here yet).
    // Actually, we should apply withAuth(redirectIfAuthenticated: '/dashboard') to this page too
    // to prevent logged-in users from seeing it.
    
  return (
    <>
      <Head>
        <title>Login to Riff Quest - Track Your Guitar Progress</title>
        <meta name="description" content="Sign in to Riff Quest and continue your guitar practice journey. Track progress, unlock achievements, and level up your skills." />

      </Head>
      <LoginView />
    </>
  );
};

export default LoginPage;

export const getServerSideProps = withAuth({
  redirectIfAuthenticated: "/dashboard",
  translations: ["common", "login", "yup_errors", "toast"],
});
