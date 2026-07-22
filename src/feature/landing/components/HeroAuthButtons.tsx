import { Button } from "assets/components/ui/button";
import { GoogleOneTap } from "feature/user/components/GoogleOneTap/GoogleOneTap";
import { selectIsFetching, selectUserAuth } from "feature/user/store/userSlice";
import { logInViaGoogle } from "feature/user/store/userSlice.asyncThunk";
import { ArrowRight, LayoutDashboard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const HeroAuthButtons = () => {
  const router = useRouter();
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const dispatch = useAppDispatch();
  const isGoogleFetching = useAppSelector(selectIsFetching) === "google";
  const { status } = useSession();
  const userAuth = useAppSelector(selectUserAuth);

  const isSyncing = status === "authenticated" && !userAuth;
  const isLoggedIn = !!userAuth;

  const handleGoToDashboard = () => {
    setIsDashboardLoading(true);
    router.push("/dashboard");
  };

  const handleGoogleLogin = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <>
      <GoogleOneTap />
      <div className='flex flex-col items-center gap-8'>
        {isSyncing ? (
          <div className='flex h-14 w-48 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-cyan-400 opacity-50' />
          </div>
        ) : isLoggedIn ? (
          <div className='flex flex-col items-center'>
            <div className='group relative overflow-hidden rounded-lg p-[1px]'>
              {!isDashboardLoading && (
                <div className='absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] will-change-transform' />
              )}
              <Button
                onClick={handleGoToDashboard}
                disabled={isDashboardLoading}
                className='relative h-14 overflow-hidden rounded-lg border-none bg-zinc-950 px-10 text-lg font-bold text-white transition-all hover:bg-zinc-900'>
                {isDashboardLoading ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <span className='relative z-10 flex items-center gap-2'>
                    <LayoutDashboard className='h-5 w-5 transition-transform' />
                    Go to Dashboard
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-6'>
            <div className='flex flex-col items-center gap-2'>
              <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
                <Link href='/signup'>
                  <div className='group relative overflow-hidden rounded-lg p-[1px] transition-transform duration-300 active:scale-[0.98]'>
                    <div className='absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100 will-change-transform' />
                    <Button className='group/btn relative h-14 overflow-hidden rounded-lg border-none bg-white px-8 text-base font-bold text-black transition-all hover:bg-zinc-50'>
                      <span className='relative z-10 flex items-center gap-3 whitespace-nowrap'>
                        Start My Guitar Progress
                        <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-300 group-hover/btn:translate-x-1.5' />
                      </span>
                    </Button>
                  </div>
                </Link>
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleFetching}
                  className='flex h-14 items-center gap-3 rounded-lg bg-zinc-900 px-8 text-base font-semibold text-white transition-all hover:bg-zinc-800'>
                  <FcGoogle className='mr-2 h-5 w-5' /> Continue with Google
                </Button>
              </div>
              <span className='mt-1 whitespace-nowrap text-center text-xs font-medium text-zinc-400'>
                Free forever for tracking progress
              </span>
            </div>
            <div className='mt-1 flex items-center gap-3 text-sm font-medium text-zinc-400'>
              <Link
                href='/login'
                className='transition-colors hover:text-cyan-400'>
                Sign in
              </Link>
              <span aria-hidden>·</span>
              <Link
                href='/how-it-works'
                className='transition-colors hover:text-cyan-400'>
                How it works
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
