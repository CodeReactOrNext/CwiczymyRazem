import { Button } from "assets/components/ui/button";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const HeroAuthButtons = () => {
  const dispatch = useAppDispatch();
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";
  const { status } = useSession();

  // The session is enough to offer the way in. Waiting for the profile as well
  // (Firebase restoring its user, then /api/user/getUserData) kept a spinner in
  // place of the button for seconds on a cold start, and the click then waited
  // again for router.push to fetch the dashboard. The sync runs in `_app` either
  // way — the dashboard shows its shell until it lands — and a <Link> prefetches
  // the route while the button is on screen.
  const isLoggedIn = status === "authenticated";

  const handleGoogleLogin = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <>
      <GoogleOneTap />
      <div className='flex flex-col items-center gap-8'>
        {isLoggedIn ? (
          <div className='flex flex-col items-center'>
            <Link href='/dashboard'>
              <Button className='h-14 rounded-lg border-none bg-white px-10 text-lg font-bold text-black transition-colors hover:bg-zinc-50 active:scale-[0.98]'>
                <span className='flex items-center gap-2'>
                  <LayoutDashboard className='h-5 w-5' />
                  Go to Dashboard
                </span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-2'>
            <div className='flex flex-col items-center gap-4 sm:flex-row'>
              <Link
                href='/signup'
                onClick={() => trackSignupCtaClicked("landing_hero")}>
                <Button className='group/btn h-14 rounded-lg border-none bg-white px-8 text-base font-bold text-black transition-colors duration-base hover:bg-zinc-50 active:scale-[0.98]'>
                  <span className='flex items-center gap-3 whitespace-nowrap'>
                    Start tracking
                    <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-base group-hover/btn:translate-x-1.5' />
                  </span>
                </Button>
              </Link>
              <Button
                onClick={handleGoogleLogin}
                disabled={isGoogleFetching}
                className='flex h-14 items-center gap-3 rounded-lg bg-zinc-900 px-8 text-base font-semibold text-white transition-colors hover:bg-zinc-800'>
                <FcGoogle className='mr-2 h-5 w-5' /> Continue with Google
              </Button>
            </div>
            <span className='mt-1 max-w-xs text-center text-xs font-medium leading-relaxed text-zinc-400'>
              No credit card. Funded by player donations, not subscriptions.
            </span>
          </div>
        )}
      </div>
    </>
  );
};
