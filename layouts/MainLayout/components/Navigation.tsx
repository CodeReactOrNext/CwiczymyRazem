import Link from "next/link";
import { FaBars } from "react-icons/fa";

export default function Navigation() {
  return (
    <nav className='right-0 top-0 z-50'>
      <ul className='hidden gap-8 text-3xl lg:flex 2xl:gap-32'>
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
      {/* PLACEHOLDER */}
      <button className='lg:hidden'>
        <ul className='flex flex-col gap-1'>
          <FaBars />
        </ul>
      </button>
      {/* PLACEHOLDER */}
    </nav>
  );
}
