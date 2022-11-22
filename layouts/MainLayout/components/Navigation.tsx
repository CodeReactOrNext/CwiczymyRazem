import HamburgerLayout from "layouts/HamburgerLayout";
import Link from "next/link";
import { useState } from "react";
import { FaBars } from "react-icons/fa";

export default function Navigation({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) {
  const [hamburgerVisible, setHamburgerVisible] = useState<boolean>(false);

  const hamburgerHandler = () => {
    setHamburgerVisible(!hamburgerVisible);
  };

  return (
    <nav
      className={`lg:clip-nav right-0 top-0 z-50 flex h-full items-center justify-center pr-8 lg:w-8/12 xl:w-9/12 ${
        variant === "landing" ? " lg:w-5/12 xl:w-5/12" : ""
      }  ${
        variant === "secondary" ? "lg:bg-main-opposed-500" : "lg:bg-second-500"
      }  lg:pl-16`}>
      <ul className='hidden w-full items-center justify-evenly gap-8 text-3xl lg:flex'>
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
      <button className='h-8 w-8 lg:hidden' onClick={hamburgerHandler}>
        <FaBars className='h-full w-full' />
      </button>
      {hamburgerVisible && (
        <HamburgerLayout buttonOnClick={hamburgerHandler}>
          <li>
            <Link href='/leaderboard'>Leaderboard</Link>
          </li>
          <li>
            <Link href='/discord'>Discord</Link>
          </li>
          <li>
            <Link href='/faq'>FAQ</Link>
          </li>
        </HamburgerLayout>
      )}
    </nav>
  );
}
