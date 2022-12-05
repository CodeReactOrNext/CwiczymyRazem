import Avatar from "components/Avatar";
import Logo from "components/Logo";
import UserNav from "components/UserNav";
import { Level } from "./components/Level";
import { NavDecoration } from "./components/NavDecoration";
import { WelcomeMessage } from "./components/WelcomMessage";

export default function UserHeader() {
  return (
    <>
      <div className='flex flex-col items-start space-x-2 space-y-2 text-lg '>
        <div className='flex flex-row items-center gap-10'>
          <div className=' lg:mr-4'>
            <Logo />
            <Avatar name={name} lvl={lvl} />
            <UserNav />
          </div>
          <WelcomeMessage userName='d' place={1} points={35253} />
        </div>
      </div>
      <NavDecoration />
      <Level />
    </>
  );
}
