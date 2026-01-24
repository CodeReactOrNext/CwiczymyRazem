import RecordingsView from "feature/recordings/components/RecordingsView";
import Head from "next/head";
import AppLayout from "layouts/AppLayout"; // Import Layout
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const RecordingsPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Recordings | RiffQuest</title>
        <meta name="description" content="Share and discover guitar covers and practice recordings." />
      </Head>
      <RecordingsView />
    </>
  );
};

RecordingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId={"recordings"}
      subtitle="Recordings"
      variant='primary'>
      {page}
    </AppLayout>
  );
};

export default RecordingsPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
        "common",
        "profile",
        "achievements",
        "toast", // Ensure toast translations are available
  ],
});
