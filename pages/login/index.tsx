import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import LoginView from "../../feature/user/view/LoginView/LoginView";
import PageLoadingSpinner from "components/PageLoadingSpinner";
import useAutoLogIn from "hooks/useAutoLogIn";

const LoginPage: NextPage = (props) => {
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });
  if (isLoggedIn || isLoading)
    return <PageLoadingSpinner layoutVariant='primary' />;
  else return <LoginView />;
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
