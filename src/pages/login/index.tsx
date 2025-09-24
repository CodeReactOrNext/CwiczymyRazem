import LoginView from "feature/user/view/LoginView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const LoginPage: NextPage = () => {
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });

  if (isLoggedIn || isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950'>
        <PageLoadingLayout />
      </div>
    );
  }

  return <LoginView />;
};

export default LoginPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "login",
        "yup_errors",
        "toast",
      ])),
    },
  };
}
