import ProfileView from "feature/profile/ProfileView";
import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../../next-i18next.config";

const Profile: NextPage = () => {
  return <ProfileView />;
};

export default Profile;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        [
          "common",
          "profile",
          "footer",
          "achievements",
          "toast",
          "skills",
          "songs",
        ],
        nextI18nextConfig
      )),
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}
