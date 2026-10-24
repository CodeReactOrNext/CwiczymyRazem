import axios from "axios";
import type { User } from "firebase/auth";
import type {
  FetchedReportDataInterface,
  updateReprotInterface,
  UserDataInterface,
} from "types/api.types";

/**
 * The route takes the uid from the verified ID token. Only the token and the
 * profile fields it needs go over the wire, not the serialized `User` (which
 * would carry the refresh token too). `displayName` overrides the account's
 * for a sign-up that has just picked its nick; `emailConsent` is that sign-up's
 * answer to the email checkbox.
 */
export const fetchUserData = async (
  user: User,
  displayName?: string,
  emailConsent?: boolean,
) =>
  axios
    .post<UserDataInterface>(
      "/api/user/getUserData",
      {
        idToken: await user.getIdToken(),
        displayName: displayName ?? user.displayName,
        photoURL: user.photoURL,
        emailConsent,
      },
      // Without a timeout a stalled request (regional network / cold serverless
      // start) leaves autoLogIn pending forever, which keeps the dashboard on
      // its loading spinner. Reject instead so autoLogIn.rejected can recover.
      { timeout: 15000 }
    )
    .then((response) => response.data);

// Firebase saying the account itself is no longer good — not that it couldn't
// be reached (`auth/network-request-failed` is the offline case).
const REFUSING_AUTH_CODES = new Set([
  "auth/user-token-expired",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/invalid-user-token",
]);

/**
 * True when a login failed because the player is not (or no longer) signed in,
 * false when it failed for want of a connection — offline, a timeout, a 5xx.
 * Only the first is a reason to sign anyone out.
 */
export const isAuthRefusal = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && REFUSING_AUTH_CODES.has(code);
};

export const fetchReport =({ token, inputData }: updateReprotInterface) =>
  axios
    .post<FetchedReportDataInterface>("/api/user/report", {
      token,
      inputData,
    })
    .then((response) => response.data);
