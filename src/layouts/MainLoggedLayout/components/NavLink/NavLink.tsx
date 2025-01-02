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
        className={`rounded-md p-1  md:px-6 tracking-wide sm:px-4 
          ${
            isCurrentPage
              ? "bg-second-400 text-mainText shadow-sm"
              : "text-second-400  hover:text-second-900"
          } 
          transition-colors  duration-200`}>
        {name}
      </button>
    </Link>
  );
};

export default NavLink;
