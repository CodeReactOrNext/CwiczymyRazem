import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import LoginView from "../../feature/user/view/LoginView/LoginView";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import useAutoLogIn from "hooks/useAutoLogIn";
import MainLayout from "layouts/MainLayout";
import { useTranslation } from "react-i18next";

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
