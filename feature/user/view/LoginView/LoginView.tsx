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
      <div className='direction-row flex-row items-center  justify-center '>
        <Input Icon={FaUserAlt} placeholder={"Login"} />
        <Input Icon={FaLock} placeholder={"Hasło"} />
        <div className='p-8'>
          <Button onClick={logGoogleUser}>Loguj</Button>
          <Button variant='secondary'>Rejestracja</Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginView;
