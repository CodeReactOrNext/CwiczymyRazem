import GuideView from "feature/guide/view/GuideView";
import { NextPage } from "next";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

const GuidePage: NextPage = () => {
  return (
    <AppLayout pageId={"guide"} subtitle="App Guide" variant="secondary">
      <GuideView />
    </AppLayout>
  );
};

export default GuidePage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common"],
});
