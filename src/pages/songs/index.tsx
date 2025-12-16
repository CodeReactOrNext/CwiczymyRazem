import SongsView from "feature/songs/SongsView";
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

const SongsPage: NextPage = () => {
  const { t } = useTranslation("songs");


  return (
    <AppLayout
      pageId={"songs"}
      subtitle={t("subtitlebar_text")}
      variant='primary'>
      <SongsView />
    </AppLayout>
  );
};

export default SongsPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
        "common",
        "songs",
        "profile",
        "achievements",
        "toast",
  ],
});
