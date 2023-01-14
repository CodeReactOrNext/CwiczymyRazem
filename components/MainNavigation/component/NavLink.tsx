import Link from "next/link";

interface NavLinkProps {
  url: string;
  title: string;
}
const NavLink = ({ url, title }: NavLinkProps) => {
  return (
    <Link href={url}>
      <li className='min-w-[6rem]  cursor-pointer p-2 px-4 text-center transition-background hover:bg-white hover:bg-opacity-10 hover:shadow-sm active:click-behavior'>
        {title}
      </li>
    </Link>
  );
};
export default NavLink;
