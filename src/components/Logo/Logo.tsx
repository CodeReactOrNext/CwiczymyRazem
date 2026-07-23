import { cn } from "assets/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  large?: boolean;
  /** Renders smaller on mobile (standard size from sm: up) for compact bars like the sticky nav. */
  compact?: boolean;
}

export const Logo = ({ large, compact }: LogoProps) => {
  return (
    <Link href='/'>
      <div className='z-50 flex cursor-pointer items-center'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={large ? 320 : 220}
          height={large ? 58 : 40}
          className={cn(
            "w-auto",
            large ? "h-14" : compact ? "h-6 sm:h-10" : "h-10",
          )}
          priority
        />
      </div>
    </Link>
  );
};
