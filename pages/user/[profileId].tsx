import type { NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { firebaseGetUserData } from "utils/firebase/firebase.utils";

import ProfileView from "views/ProfileView";

const Profile: NextPage = () => {
  return <ProfileView />;
};

export default Profile;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "profile",
        "footer",
        "achievements",
      ])),
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  };
}
