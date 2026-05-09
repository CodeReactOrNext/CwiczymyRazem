import MainContainer from "components/MainContainer";
import SongsView from "feature/songs/SongsView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const SongsPage: NextPageWithLayout = () => {

  return (
    <MainContainer noBorder>
      <SongsView />
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
