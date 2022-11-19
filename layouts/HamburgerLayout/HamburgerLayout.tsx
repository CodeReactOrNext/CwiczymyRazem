/* eslint-disable @next/next/no-img-element */
import Logo from "components/Logo";
import React from "react";
import { FaTimes } from "react-icons/fa";

interface Props {
  buttonOnClick: () => void;
  children: React.ReactNode;
}

export default function HamburgerLayout({ buttonOnClick, children }: Props) {
  return (
    <div className='absolute top-0 bottom-0 left-0 z-50 h-[100vh] w-full'>
      <div className='h-full w-full bg-second-500'>
        <header className='flex items-center justify-between py-4 px-8'>
          <Logo />
          <button className='h-8 w-8' onClick={buttonOnClick}>
            <FaTimes className='h-full w-full' />
          </button>
        </header>
        <img
          className='w absolute left-[70%] h-3/4'
          src='/static/images/guitar_black.png'
          alt=''
        />
        <img
          className='w absolute right-[70%] h-3/4 rotate-180'
          src='/static/images/guitar_red.png'
          alt=''
        />

        <ul className='flex h-full flex-col items-center justify-center gap-6 text-6xl'>
          {children}
        </ul>
      </div>
    </div>
  );
}
