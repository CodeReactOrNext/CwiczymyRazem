import ProfileView from "feature/profile/ProfileView";
import type { NextPage } from "next";

const Profile: NextPage = () => {
  return <ProfileView />;
};

export default Profile;

export async function getStaticProps() {
  return {
    props: {},
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}
