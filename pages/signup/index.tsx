import PageLoadingSpinner from "components/PageLoadingSpinner";
import useAutoLogIn from "hooks/useAutoLogIn";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import SingupView from "../../feature/user/view/SingupView/SingupView";
const SignUpPage: NextPage = () => {
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });

  if (isLoggedIn || isLoading)
    return <PageLoadingSpinner layoutVariant='primary' />;
  else return <SingupView />;
};

export default SignUpPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "signup",
        "yup_errors",
      ])),
    },
  };
}
