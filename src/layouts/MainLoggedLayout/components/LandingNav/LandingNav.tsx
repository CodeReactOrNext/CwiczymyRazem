import { NavPagesTypes } from "wrappers/AuthLayoutWrapper";
import NavLink from "../NavLink";

export interface LandingNavLinkInterface {
  id: NavPagesTypes;
  name: string;
  href: string;
  external?: boolean;
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
    <div className='relative flex w-full justify-around bg-white py-2 text-base uppercase text-main-opposed-text sm:text-2xl md:gap-x-[150px] xl:gap-x-[250px]'>
      <div className='z-40 flex h-full w-full justify-around'>
        {leftSideLinks.map(({ href, name, id, external }) => (
          <NavLink
            key={id}
            href={href}
            name={name}
            isCurrentPage={id === pageId}
            external={external}
          />
        ))}
      </div>
      <div className='z-40 flex w-full justify-around'>
        {rightSideLinks.map(({ href, name, id, external }) => (
          <NavLink
            key={id}
            href={href}
            name={name}
            isCurrentPage={id === pageId}
            external={external}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingNav;
