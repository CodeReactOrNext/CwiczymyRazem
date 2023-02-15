import Link from "next/link";

interface NavLinkProps {
  href: string;
  name: string;
  isCurrentPage: boolean;
  external?: boolean;
}

const NavLink = ({ href, name, isCurrentPage, external }: NavLinkProps) => {
  return (
    <Link href={href}>
      <a target={external ? "_blank" : undefined} rel='noopener noreferrer'>
        <button
          disabled={isCurrentPage}
          className={`active:click-behavio p-1 px-2 radius-default sm:px-4  
            ${
              isCurrentPage
                ? " bg-second-500 text-mainText shadow-sm"
                : " click-behavior hover:bg-second-500 hover:text-mainText"
            } `}>
          {name}
        </button>
      </a>
    </Link>
  );
};

export default NavLink;
