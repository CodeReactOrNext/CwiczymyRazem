import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";

const SeasonsPage: NextPage = () => {
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <AuthLayoutWrapper
      pageId={"seasons"}
      subtitle='Seasons'
      variant='secondary'>
      {isLoggedIn ? (
        <LeadboardView defaultView='seasonal' />
      ) : (
        <PageLoadingLayout />
      )}
    </AuthLayoutWrapper>
  );
};

export default SeasonsPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "leadboard",
        "achievements",
        "toast",
      ])),
    },
  };
}
