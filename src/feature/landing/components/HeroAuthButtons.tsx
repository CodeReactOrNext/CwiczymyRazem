import { HeroCtaButtons } from "feature/landing/components/HeroCtaButtons";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const HeroAuthButtons = () => {
  const dispatch = useAppDispatch();
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";
  const { status } = useSession();

  // The first frame always shows the visitor's keys, the same ones the static
  // page had, even when the session is already known by the time this chunk
  // mounts. The labels then roll over instead of being swapped mid-paint.
  const [isArmed, setIsArmed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // The session is enough to offer the way in. Waiting for the profile as well
  // (Firebase restoring its user, then /api/user/getUserData) kept a spinner in
  // place of the button for seconds on a cold start, and the click then waited
  // again for router.push to fetch the dashboard. The sync runs in `_app` either
  // way — the dashboard shows its shell until it lands — and a <Link> prefetches
  // the route while the button is on screen.
  const isLoggedIn = isArmed && status === "authenticated";

  return (
    <>
      <GoogleOneTap />
      <HeroCtaButtons
        isLoggedIn={isLoggedIn}
        isGoogleBusy={isGoogleFetching}
        onGoogleLogin={() => dispatch(logInViaGoogle())}
      />
    </>
  );
};
