import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";

import useAutoLogIn from "hooks/useAutoLogIn";
import SingupView from "feature/user/view/SingupView/SingupView";

const SignUpPage: NextPage = () => {
  const { t } = useTranslation("signup");
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });
  return (
    <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
      {isLoggedIn || isLoading ? <PageLoadingLayout /> : <SingupView />}
    </MainLayout>
  );
};

export default SignUpPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "signup",
        "yup_errors",
        "toast",
      ])),
    },
  };
}
