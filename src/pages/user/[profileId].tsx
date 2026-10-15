import ProfileView from "feature/profile/ProfileView";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

/**
 * Member profiles are an in-app view, not a public page. As SSG with
 * `fallback: true` and no `paths` this route answered 200 with an empty
 * client-rendered shell for *any* id a crawler invented — an unbounded
 * soft-404 surface with no title and no canonical (SEO audit 2026-09-16).
 *
 * It is now behind the same server-side gate as the rest of the app: signed-out
 * visitors (crawlers included) get a 307 to /login and nothing is indexable.
 * Profile links shared outside the app — the Discord bot's general log, the
 * "copy profile link" button — still resolve, they just ask for a login first.
 */
const Profile: NextPageWithLayout = () => (
  <>
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
    <ProfileView />
  </>
);

// Through getLayout like every other app page, so the shell (sidebar, header,
// community drawer) stays mounted when a profile is opened or left.
Profile.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={null} variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default Profile;

Profile.getInitialProps = withAuthInitialProps();
