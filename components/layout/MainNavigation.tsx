import Link from "next/link";

export default function MainNavigation() {
  return (
    <nav className='right-0 top-0 z-50'>
      <ul className='hidden gap-8 text-3xl md:flex'>
        <li>
          <Link href='/leaderboard'>Leaderboard</Link>
        </li>
        <li>
          <Link href='/discord'>Discord</Link>
        </li>
        <li>
          <Link href='/faq'>FAQ</Link>
        </li>
      </ul>
      <button className='md:hidden'>
        <ul className='flex flex-col gap-1'>
          <HamburgerBar />
          <HamburgerBar />
          <HamburgerBar />
          <HamburgerBar />
          <HamburgerBar />
        </ul>
      </button>
    </nav>
  );
}

function HamburgerBar() {
  return <li className='h-1 w-10 bg-white'></li>;
}
