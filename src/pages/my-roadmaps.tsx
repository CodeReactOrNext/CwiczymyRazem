import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * Player Roadmaps used to be a page of its own under My Stuff; they are a tab
 * of the Roadmaps page now. Old links — a "roadmap ready" notification, a
 * bookmark — land here and are sent on with whatever they pointed at.
 */
const MyRoadmapsPage: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    void router.replace({
      pathname: "/ai-coach",
      query: { tab: "players", ...router.query },
    });
  }, [router]);

  return null;
};

MyRoadmapsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='my-roadmaps' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default MyRoadmapsPage;

MyRoadmapsPage.getInitialProps = withAuthInitialProps();
