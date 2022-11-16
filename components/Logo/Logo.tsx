import Link from "next/link";

const Logo = () => {
  return (
    <Link href='/'>
      <div className='z-50 flex cursor-pointer'>
        <div className='flex flex-col items-end justify-center p-2 leading-4 '>
          <p className='font-bold  text-white '>Ćwiczymy</p>
          <p className='font-bold text-tertiary '>Razem</p>
        </div>
      </div>
    </Link>
  );
};
export default Logo;
