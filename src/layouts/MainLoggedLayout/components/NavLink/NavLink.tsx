import Link from "next/link";

interface NavLinkProps {
  href: string;
  name: string;
  isCurrentPage: boolean;
  external?: boolean;
}

const NavLink = ({ href, name, isCurrentPage }: NavLinkProps) => {
  return (
    <Link href={href}>
      <button
        disabled={isCurrentPage}
        className={`p-1 px-2 tracking-wide radius-default sm:px-4 
          ${
            isCurrentPage
              ? "bg-second-500 text-mainText shadow-sm"
              : "hover:bg-second-400 hover:text-mainText"
          } 
          transition-colors  duration-200 ease-in-out`}>
        {name}
      </button>
    </Link>
  );
};

export default NavLink;
