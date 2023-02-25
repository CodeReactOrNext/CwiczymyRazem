import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import LoginView from "feature/user/view/LoginView";

const LoginPage: NextPage = () => {
  const { t } = useTranslation("login");
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });

  return (
    <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
      {isLoggedIn || isLoading ? <PageLoadingLayout /> : <LoginView />}
    </MainLayout>
  );
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
