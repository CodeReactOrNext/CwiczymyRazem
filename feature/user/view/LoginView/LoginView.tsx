import { useDispatch } from "react-redux";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import MainLayout from "../../../../layouts/MainLayout";
import {
  createUserDocumentFromAuth,
  signInWithGooglePopup,
} from "../../../../utils/firebase/firebase.utils";
import { addUserAuth, addUserName } from "../../store/userSlice";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import Slogan from "../../../../components/Slogan";

const LoginView = () => {
  const dispatch = useDispatch();
  const logGoogleUser = async () => {
    const { user } = await signInWithGooglePopup();
    dispatch(addUserName(user.displayName));
    const userAuth = await createUserDocumentFromAuth(user);
    dispatch(addUserAuth(userAuth));
  };

  return (
    <MainLayout subtitle='Ćwicz, raportuj, zdobywaj punkty!' variant='primary'>
      <div className=' flex flex-col items-center  justify-center space-y-4 '>
        <Slogan />
        <Input Icon={FaUserAlt} placeholder={"Login"} />
        <Input Icon={FaLock} placeholder={"Hasło"} />
        <div className='flex space-x-1 '>
          <Button>Loguj</Button>
          <Button variant='secondary'>Rejestracja</Button>
        </div>
        <button
          onClick={logGoogleUser}
          className='flex flex-row gap-3 bg-white p-3 font-medium tracking-wide text-[#555555]'>
          <FcGoogle size='24' /> Zaloguj się z Google
        </button>
      </div>
    </MainLayout>
  );
};

export default LoginView;
