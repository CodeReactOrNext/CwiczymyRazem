import GuideView from "feature/guide/view/GuideView";
import { NextPage } from "next";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const GuidePage: NextPageWithLayout = () => {
  return <GuideView />;
};

GuidePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"guide"} subtitle="App Guide" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default GuidePage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common"],
});
