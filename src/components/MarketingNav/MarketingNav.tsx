import Image from "next/image";
import Link from "next/link";

/**
 * Header for the signed-out, crawlable side of the site.
 *
 * Every public template used to ship its own copy of this bar, and each one
 * carried the logo plus Login/Start free and nothing else — so a reader (and a
 * crawler) landing on a practice guide had no route to any other guide, the
 * song library or the blog except the footer (SEO audit 2026-09-16). One
 * component, one set of links, every hub reachable in a single hop.
 */

/**
 * `short` is what fits on a phone. The links stay rendered at every width
 * rather than collapsing behind a `hidden` class — Google crawls mobile-first,
 * and these are the only header links to the content hubs.
 */
const LINKS = [
  { href: "/guides", label: "Practice guides", short: "Guides" },
  { href: "/song-library", label: "Songs", short: "Songs" },
  { href: "/blog", label: "Blog", short: "Blog" },
] as const;

export interface MarketingNavProps {
  /** Path of the page rendering the nav, so its own entry is marked current. */
  current?: string;
}

export const MarketingNav = ({ current }: MarketingNavProps) => (
  <nav className='fixed left-0 right-0 top-0 z-50 bg-zinc-950/90 backdrop-blur-sm'>
    <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6'>
      <Link href='/' className='transition-opacity hover:opacity-70'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={120}
          height={32}
          className='h-6 w-auto'
        />
      </Link>

      <div className='flex items-center gap-4 sm:gap-6'>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current === link.href ? "page" : undefined}
            className={
              current === link.href
                ? "text-xs font-semibold text-white sm:text-sm"
                : "text-xs text-zinc-400 transition-colors hover:text-white sm:text-sm"
            }>
            <span className='sm:hidden'>{link.short}</span>
            <span className='hidden sm:inline'>{link.label}</span>
          </Link>
        ))}

        <Link
          href='/login'
          className='hidden text-sm text-zinc-400 transition-colors hover:text-white sm:inline'>
          Login
        </Link>
        <Link
          href='/signup'
          className='rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 hover:bg-cyan-400'>
          Start free
        </Link>
      </div>
    </div>
  </nav>
);
