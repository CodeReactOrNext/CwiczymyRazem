import SongsView from "feature/songs/SongsView";
import type { NextPage } from "next";
import { useTranslation } from "react-i18next";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const SongsPage: NextPageWithLayout = () => {
  const { t } = useTranslation("songs");

  return <SongsView />;
};

SongsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"songs"}
      subtitle="Songs"
      variant='primary'>
      {page}
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
