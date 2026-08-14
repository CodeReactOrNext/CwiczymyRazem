import Image from "next/image";
import Link from "next/link";

/**
 * Top bar shown to logged-out readers of the wiki. Logged-in users get the
 * normal app shell from `AppLayout` instead, so this never renders for them —
 * see the `isLogged` guards in `pages/wiki/*`.
 *
 * Same shape as the bar on /about and /contact; the wiki is a public page now
 * and needs a way back to the marketing site and a way in.
 */
export const WikiPublicNav = () => (
  <nav className='bg-zinc-950/50 backdrop-blur-xl'>
    <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8'>
      <Link href='/' className='flex items-center gap-2'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={120}
          height={32}
          className='h-6 w-auto'
          priority
        />
      </Link>
      <div className='flex items-center gap-4'>
        <Link
          href='/login'
          className='text-sm font-medium text-zinc-400 transition-colors hover:text-white'>
          Login
        </Link>
        <Link
          href='/signup'
          className='rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-cyan-400'>
          Start Free
        </Link>
      </div>
    </div>
  </nav>
);
