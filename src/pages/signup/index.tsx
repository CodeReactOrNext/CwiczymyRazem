import SingupView from "feature/user/view/SingupView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const SignUpPage: NextPage = () => {
  const { isLoggedIn, isLoading } = useAutoLogIn({
    redirects: { loggedIn: "/" },
  });

  if (isLoggedIn || isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black'>
        <PageLoadingLayout />
      </div>
    );
  }

  return <SingupView />;
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
