import Link from "next/link";

interface NavLinkProps {
  href: string;
  name: string;
  isCurrentPage: boolean;
}

const NavLink = ({ href, name, isCurrentPage }: NavLinkProps) => {
  return (
    <Link href={href}>
      <button
        disabled={isCurrentPage}
        className={`active:click-behavio p-1 px-2 sm:px-4 radius-default  
            ${
              isCurrentPage
                ? " bg-second-500 text-mainText shadow-sm"
                : " click-behavior hover:bg-second-500 hover:text-mainText"
            } `}>
        {name}
      </button>
    </Link>
  );
};

export default NavLink;
