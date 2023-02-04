import { NavPagesTypes } from "Hoc/AuthLayoutWrapper";
import NavLink from "./NavLink";

export interface LandingNavLinkInterface {
  id: NavPagesTypes;
  name: string;
  href: string;
}

export interface LandingNavObjectInterface {
  leftSideLinks: LandingNavLinkInterface[];
  rightSideLinks: LandingNavLinkInterface[];
}

export interface LandingNavProps {
  leftSideLinks: LandingNavLinkInterface[];
  rightSideLinks: LandingNavLinkInterface[];
  pageId: NavPagesTypes;
}

const LandingNav = ({
  leftSideLinks,
  rightSideLinks,
  pageId,
}: LandingNavProps) => {
  return (
    <div className='relative flex w-full justify-around bg-tertiary py-2 text-base uppercase text-second sm:text-3xl md:gap-x-[150px] xl:gap-x-[250px]'>
      <div className='z-40 flex h-full w-full justify-around'>
        {leftSideLinks.map(({ href, name, id }) => (
          <NavLink
            key={id}
            href={href}
            name={name}
            isCurrentPage={id === pageId}
          />
        ))}
      </div>
      <div className='z-40  flex w-full  justify-around'>
        {rightSideLinks.map(({ href, name, id }) => (
          <NavLink
            key={id}
            href={href}
            name={name}
            isCurrentPage={id === pageId}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingNav;
