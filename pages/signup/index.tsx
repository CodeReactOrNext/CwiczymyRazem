import PageLoadingLayout from "layouts/PageLoadingLayout";
import useAutoLogIn from "hooks/useAutoLogIn";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import SingupView from "../../feature/user/view/SingupView/SingupView";
import { useTranslation } from "react-i18next";
import MainLayout from "layouts/MainLayout";

const SignUpPage: NextPage = () => {
  const { t } = useTranslation("signup");
  const { isLoggedIn } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });
  return (
    <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <SingupView />}
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
