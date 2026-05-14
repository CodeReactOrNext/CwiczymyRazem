import MainContainer from "components/MainContainer";
import SongsView from "feature/songs/SongsView";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const SongsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const view = (router.query.view as string) || "explore";
  const songId = (router.query.songId as string) || "";

  return (
    <MainContainer noBorder>
      <SongsView view={view} initialSongId={songId} />
    </MainContainer>
  );
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
