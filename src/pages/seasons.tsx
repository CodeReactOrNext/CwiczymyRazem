import { LeadboardView } from "feature/leadboard/LeadboardView";
import useAutoLogIn from "hooks/useAutoLogIn";
import PageLoadingLayout from "layouts/PageLoadingLayout";
import type { NextPage } from "next";
import { withAuth } from "utils/auth/serverAuth";
import AppLayout from "layouts/AppLayout";

const SeasonsPage: NextPage = () => {


  return (
    <AppLayout
      pageId={"seasons"}
      subtitle='Seasons'
      variant='secondary'>
      <LeadboardView defaultView='seasonal' />
    </AppLayout>
  );
};

export default SeasonsPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "leadboard",
    "achievements",
    "toast",
  ],
});
