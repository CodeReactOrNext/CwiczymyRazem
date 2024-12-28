import Link from "next/link";

interface NavLinkProps {
  url: string;
  title: string;
  external?: boolean;
}
const NavLink = ({ url, title, external }: NavLinkProps) => {
  return (
    <Link href={url} target={external ? "_blank" : undefined} rel='noreferrer'>
      <li className='min-w-[6rem] cursor-pointer p-2 px-4 text-center transition-background radius-default hover:bg-white hover:bg-opacity-10 hover:shadow-sm active:click-behavior'>
        {title}
      </li>
    </Link>
  );
};
export default NavLink;
