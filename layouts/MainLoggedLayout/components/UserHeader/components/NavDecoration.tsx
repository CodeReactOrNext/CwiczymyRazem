import Lightning from "public/static/images/svg/Lightning";

const NavDecoration = () => {
  return (
    <div className='relative hidden flex-col md:flex  '>
      <Lightning className='relative bottom-[-200px] h-72 fill-tertiary xl:bottom-[-240px] xl:h-96' />
      <div className='relative bottom-[20px] z-40 m-auto  h-[350px] w-[80px] bg-guitarImage bg-contain bg-no-repeat xl:bottom-[100px] xl:w-[110px] '></div>
    </div>
  );
};
export default NavDecoration;
