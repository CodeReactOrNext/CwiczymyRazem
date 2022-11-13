import Slogan from "../../components/Slogan";

const FormLayout = ({ children }: { children: React.ReactElement }) => {
  return (
    <div className='flex w-[230px] flex-col items-center  justify-center space-y-4 xs:w-[320px] sm:w-[400px]'>
      <Slogan />
      {children}
    </div>
  );
};
export default FormLayout;
