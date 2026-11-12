import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowRight, LayoutDashboard, Play } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { FcGoogle } from "react-icons/fc";

const FACE =
  "col-start-1 row-start-1 flex items-center justify-center gap-3 transition-[transform,opacity,filter] duration-500 ease-in-out motion-reduce:transition-none";

/**
 * Two labels in one grid cell: the cell is always as big as the larger one, so
 * swapping them never resizes the button (or the hero below it). The visitor's
 * label rolls up and out, the member's rolls in from below.
 */
const Roll = ({
  showMember,
  visitor,
  member,
  delayMs = 0,
  className,
}: {
  showMember: boolean;
  visitor: ReactNode;
  member: ReactNode;
  delayMs?: number;
  className?: string;
}) => {
  const style = { transitionDelay: `${delayMs}ms` };
  return (
    <span className={cn("grid overflow-hidden", className)}>
      <span
        aria-hidden={showMember}
        style={style}
        className={cn(
          FACE,
          showMember && "-translate-y-full opacity-0 blur-[2px]",
        )}>
        {visitor}
      </span>
      <span
        aria-hidden={!showMember}
        style={style}
        className={cn(
          FACE,
          !showMember && "translate-y-full opacity-0 blur-[2px]",
        )}>
        {member}
      </span>
    </span>
  );
};

// The clip sits 8px outside the text line, so a label is not cut at its own
// edge the moment it starts moving.
const LABEL = "-my-2 whitespace-nowrap py-2";

interface HeroCtaButtonsProps {
  isLoggedIn: boolean;
  isGoogleBusy?: boolean;
  /** Without it (static HTML, before the auth chunk loads) the Google key is a
   * plain link to the login page. */
  onGoogleLogin?: () => void;
}

/**
 * The hero's call to action in both of its states. One set of keys serves the
 * visitor and the signed-in player: the server-rendered page, the auth chunk
 * and the resolved session all render this same box, so nothing moves when one
 * replaces the other. Only the labels change.
 */
export const HeroCtaButtons = ({
  isLoggedIn,
  isGoogleBusy = false,
  onGoogleLogin,
}: HeroCtaButtonsProps) => {
  const handlePrimaryClick = () => {
    if (!isLoggedIn) trackSignupCtaClicked("landing_hero");
  };

  const handleSecondaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isLoggedIn || !onGoogleLogin) return;
    event.preventDefault();
    onGoogleLogin();
  };

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='flex flex-col items-center gap-4 sm:flex-row'>
        <Button
          asChild
          className='group/btn h-14 rounded-lg border-b-zinc-400 bg-white px-8 text-base font-bold text-black hover:bg-zinc-100'>
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            onClick={handlePrimaryClick}>
            <Roll
              showMember={isLoggedIn}
              className={LABEL}
              visitor={
                <>
                  Start tracking
                  <ArrowRight className='h-5 w-5 text-cyan-500 transition-transform duration-base group-hover/btn:translate-x-1.5' />
                </>
              }
              member={
                <>
                  <LayoutDashboard className='h-5 w-5' />
                  Go to Dashboard
                </>
              }
            />
          </Link>
        </Button>
        <Button
          asChild
          className={cn(
            "h-14 rounded-lg border-b-zinc-950 bg-zinc-800 px-8 text-base font-semibold text-white hover:bg-zinc-700",
            isGoogleBusy && "pointer-events-none opacity-50",
          )}>
          <Link
            href={isLoggedIn ? "/timer" : "/login"}
            aria-disabled={isGoogleBusy || undefined}
            onClick={handleSecondaryClick}>
            <Roll
              showMember={isLoggedIn}
              delayMs={70}
              className={LABEL}
              visitor={
                <>
                  <FcGoogle className='h-5 w-5' />
                  Continue with Google
                </>
              }
              member={
                <>
                  <Play className='h-5 w-5' />
                  Start practicing
                </>
              }
            />
          </Link>
        </Button>
      </div>
      <Roll
        showMember={isLoggedIn}
        delayMs={140}
        className='mt-1 max-w-xs text-center [text-wrap:balance] text-xs font-medium leading-relaxed text-zinc-400'
        visitor='No credit card. Funded by player donations, not subscriptions.'
        member='Welcome back. Your practice log is right where you left it.'
      />
    </div>
  );
};
