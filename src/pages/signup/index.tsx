import SingupView from "feature/user/view/SingupView";
import useAutoLogIn from "hooks/useAutoLogIn";
import MainLayout from "layouts/MainLayout";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";

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
