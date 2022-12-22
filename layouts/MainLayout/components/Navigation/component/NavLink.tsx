import Link from "next/link";

const NavLink = ({ url, title }: { url: string; title: string }) => {
  return (
    <li className='min-w-[6rem]  p-2 px-4 text-center transition-background  hover:bg-white hover:bg-opacity-10 hover:shadow-sm active:click-behavior'>
      <Link href={url}>{title}</Link>
    </li>
  );
};
export default NavLink;
