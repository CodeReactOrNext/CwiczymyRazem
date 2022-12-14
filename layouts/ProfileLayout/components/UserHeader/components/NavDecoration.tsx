import Lightning from "public/static/images/svg/Lightning";
export const NavDecoration = () => {
  return (
    <div className='relative hidden flex-col md:flex  '>
      <Lightning className='relative bottom-[-150px] h-72 fill-tertiary xl:bottom-[-240px] xl:h-96' />
      <img
        className='hover-animation relative bottom-[90px] z-40  m-auto w-[80px] xl:w-[110px] '
        src='/static/images/guitar_blue.png'
        alt='blue guitar'
      />
    </div>
  );
};
