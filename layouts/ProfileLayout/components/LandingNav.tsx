import Link from "next/link";

export interface LandingNavProps {
  leftSideLinks: { name: string; href: string }[];
  rightSideLinks: { name: string; href: string }[];
}

const LandingNav = ({ leftSideLinks, rightSideLinks }: LandingNavProps) => {
  return (
    <div className='relative flex w-full justify-around bg-tertiary py-3 text-xl uppercase text-second sm:text-3xl md:gap-x-[150px] xl:gap-x-[250px]'>
      <div className='z-50 flex w-full justify-around'>
        {leftSideLinks.map(({ href, name }) => (
          <Link key={href + name} href={href}>
            <button className='hover:text-second-200 active:click-behavior'>
              {name}
            </button>
          </Link>
        ))}
      </div>
      <div className='z-50  flex w-full  justify-around'>
        {rightSideLinks.map(({ href, name }) => (
          <Link key={href + name} href={href}>
            <button className='hover:text-second-200 active:click-behavior'>
              {name}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LandingNav;
