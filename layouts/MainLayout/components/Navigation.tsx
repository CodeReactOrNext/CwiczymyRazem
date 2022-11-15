import Link from "next/link";
import { FaBars } from "react-icons/fa";

export default function Navigation({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  return (
    <nav
      className={`clip-nav right-0 top-0 z-50 flex h-full items-center justify-center pr-8 lg:w-2/5 ${
        variant === "landing" ? "xl:w-1/3" : ""
      }  ${
        variant === "secondary" ? "lg:bg-main-opposed-500" : "lg:bg-second-500"
      }  lg:pl-16`}>
      <ul className='hidden w-full justify-evenly gap-8 text-3xl lg:flex'>
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
      <button className='lg:hidden'>
        <ul className='flex flex-col gap-1'>
          <FaBars />
        </ul>
      </button>
    </nav>
  );
}
