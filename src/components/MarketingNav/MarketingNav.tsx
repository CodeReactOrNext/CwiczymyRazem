import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
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
 *
 * Since the 2026-11-27 look audit it is also the only public header: the home
 * page, how-it-works, about, FAQ, contact, tools, the blog and the wiki each had
 * a bar of their own (six shapes, four styles of call to action).
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

/** Shown from `lg` up only: on a phone the three hubs above already fill the bar. */
const WIDE_LINKS = [{ href: "/how-it-works", label: "How it works" }] as const;

const linkClass = (isCurrent: boolean) =>
  isCurrent
    ? "text-xs font-semibold text-white sm:text-sm"
    : "text-xs text-zinc-400 transition-colors hover:text-white sm:text-sm";

export interface MarketingNavProps {
  /** Path of the page rendering the nav, so its own entry is marked current. */
  current?: string;
  /**
   * The bar is fixed. Pages written for it pad their first section themselves;
   * a page that had an in-flow bar passes `spacer` and gets the 64px back.
   */
  spacer?: boolean;
}

export const MarketingNav = ({ current, spacer = false }: MarketingNavProps) => (
  <>
    <nav className='fixed left-0 right-0 top-0 z-50 bg-zinc-950/90 backdrop-blur-sm'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-6'>
        <Link href='/' className='shrink-0 transition-opacity hover:opacity-70'>
          {/* The wordmark is 156px wide at this height: with three hub links
              and the key it overflowed a 390px phone, so a phone gets the mark. */}
          <Image
            src='/images/logolight.svg'
            alt='Riff Quest'
            width={32}
            height={32}
            className='h-7 w-auto sm:hidden'
            priority
          />
          <Image
            src='/images/longlightlogo.svg'
            alt=''
            width={120}
            height={32}
            className='hidden h-6 w-auto sm:block'
            priority
          />
        </Link>

        <div className='flex items-center gap-3 sm:gap-6'>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current === link.href ? "page" : undefined}
              className={linkClass(current === link.href)}>
              <span className='sm:hidden'>{link.short}</span>
              <span className='hidden sm:inline'>{link.label}</span>
            </Link>
          ))}

          {WIDE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current === link.href ? "page" : undefined}
              className={cn("hidden lg:inline", linkClass(current === link.href))}>
              {link.label}
            </Link>
          ))}

          <Link
            href='/login'
            className='hidden text-sm text-zinc-400 transition-colors hover:text-white sm:inline'>
            Login
          </Link>
          {/* The white key, as in the home hero: the one call to action on the
              public site. Cyan stays for links and marks, not button faces. */}
          <Button
            asChild
            className='h-8 border-b-zinc-400 bg-white px-3 text-xs font-bold text-black hover:bg-zinc-100 sm:h-9 sm:px-4 sm:text-sm'>
            <Link href='/signup'>Start free</Link>
          </Button>
        </div>
      </div>
    </nav>
    {spacer && <div className='h-16' aria-hidden='true' />}
  </>
);
