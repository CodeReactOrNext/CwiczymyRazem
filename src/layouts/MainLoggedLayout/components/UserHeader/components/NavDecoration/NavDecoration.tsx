import Lightning from "public/static/images/svg/Lightning";

const NavDecoration = () => {
  return (
    <div className='relative hidden flex-col md:flex'>
      <Lightning className='relative bottom-[-40px] z-10 h-20 fill-tertiary xl:bottom-[-50px] xl:h-24' />
      <div className='relative bottom-[10px] z-40 m-auto h-[80px] w-[20px] bg-guitarImage bg-contain bg-no-repeat xl:bottom-[15px] xl:h-[100px] xl:w-[25px]'></div>
    </div>
  );
};
export default NavDecoration;
