import ProfileView from "feature/profile/ProfileView";
import type { NextPage } from "next";
import Head from "next/head";
import { withAuth } from "utils/auth/serverAuth";

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
const Profile: NextPage = () => (
  <>
    <Head>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
    <ProfileView />
  </>
);

export default Profile;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
});
