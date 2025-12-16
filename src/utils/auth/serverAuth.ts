import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getSession } from "next-auth/react";

type WithAuthOptions = {
  redirectIfAuthenticated?: string;
  redirectIfUnauthenticated?: string;
  translations?: string[];
};

export function withAuth(options: WithAuthOptions = {}) {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<any>> => {
    const { locale } = context;
    const session = await getSession(context);
    const isAuthenticated = !!session;

    if (isAuthenticated) {
      if (options.redirectIfAuthenticated) {
        return {
          redirect: {
            destination: options.redirectIfAuthenticated,
            permanent: false,
          },
        };
      }
    } else {
      if (options.redirectIfUnauthenticated) {
        return {
          redirect: {
            destination: options.redirectIfUnauthenticated,
            permanent: false,
          },
        };
      }
    }

    const translations = await serverSideTranslations(locale ?? "pl", [
      "common",
      ...(options.translations || []),
    ]);

    return {
      props: {
        ...translations,
        isAuthenticated,
        session,
      },
    };
  };
}
