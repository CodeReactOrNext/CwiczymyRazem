import SongsView from "feature/songs/SongsView";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const SongsPage: NextPageWithLayout = () => {

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <SongsView />
    </div>
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
