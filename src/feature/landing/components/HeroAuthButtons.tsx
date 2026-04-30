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
          <div className="h-14 w-48 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 opacity-50" />
          </div>
        ) : isLoggedIn ? (
          <div className="flex flex-col items-center">
            <div className="relative p-[1px] overflow-hidden rounded-lg group">
              {!isDashboardLoading && (
                <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] will-change-transform bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)]" />
              )}
              <Button
                onClick={handleGoToDashboard}
                disabled={isDashboardLoading}
                className='relative h-14 px-10 bg-zinc-950 hover:bg-zinc-900 text-white border-none font-bold text-lg transition-all rounded-[7px] shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)] overflow-hidden'
              >
                {isDashboardLoading ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <span className='relative z-10 flex items-center gap-2'>
                    <LayoutDashboard className='w-5 h-5 transition-transform group-hover:scale-110' />
                    Go to Dashboard
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href='/signup'>
                  <div className="relative p-[1px] overflow-hidden rounded-lg group transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] will-change-transform bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_70%,#22d3ee_100%)] opacity-100" />
                    <Button className='relative h-14 px-8 bg-white hover:bg-zinc-50 text-black border-none font-bold text-base transition-all rounded-[7px] shadow-2xl overflow-hidden group/btn'>
                      <span className="relative z-10 flex items-center gap-3 whitespace-nowrap">
                        Start My Guitar Progress
                        <ArrowRight className="w-5 h-5 text-orange-500 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                      </span>
                    </Button>
                  </div>
                </Link>
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleFetching}
                  className="h-14 px-8 bg-black text-white hover:bg-zinc-900 border border-white/10 font-semibold text-base transition-all rounded-lg flex items-center gap-3 shadow-lg"
                >
                  <FcGoogle className="h-5 w-5 mr-2" /> Continue with Google
                </Button>
              </div>
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap text-center mt-1">
                Free forever for tracking progress
              </span>
            </div>
            <div className="flex items-center gap-6 text-white text-sm font-bold uppercase tracking-widest mt-2">
              <Link href="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
              <span className="w-1 h-1 rounded-full bg-white/20"></span>
              <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">How it works</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
