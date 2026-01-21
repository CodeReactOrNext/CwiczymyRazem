import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getSession } from "next-auth/react";

type WithAuthOptions = {
  redirectIfAuthenticated?: string;
  redirectIfUnauthenticated?: string;
  translations?: string[];
};

export function withAuth(options: WithAuthOptions = {}) {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<any>> => {
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

    return {
      props: {
        isAuthenticated,
        session,
      },
    };
  };
}
