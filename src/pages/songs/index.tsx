import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";
import useAutoLogIn from "hooks/useAutoLogIn";
import SongsView from "feature/songs/SongsView";

const SongsPage: NextPage = () => {
  const { t } = useTranslation("songs");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });

  return (
    <AuthLayoutWrapper
      pageId={"songs"}
      subtitle={t("subtitlebar_text")}
      variant='primary'>
      {!isLoggedIn ? <PageLoadingLayout /> : <SongsView />}
    </AuthLayoutWrapper>
  );
};

export default SongsPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "songs",
        "profile",
        "achievements",
        "toast",
      ])),
    },
  };
}
