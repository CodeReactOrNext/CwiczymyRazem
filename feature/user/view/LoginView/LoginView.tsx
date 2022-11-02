import { useDispatch } from "react-redux";
import {
  createUserDocumentFromAuth,
  signInWithGooglePopup,
} from "../../../../utils/firebase/firebase.utils";
import { addUserAuth, addUserName } from "../../store/userSlice";

const LoginView = () => {
  const dispatch = useDispatch();
  const logGoogleUser = async () => {
    const { user } = await signInWithGooglePopup();
    dispatch(addUserName(user.displayName));
    const userAuth = await createUserDocumentFromAuth(user);
    dispatch(addUserAuth(userAuth));
  };
  return <button onClick={logGoogleUser}>Login with Google</button>;
};

export default LoginView;
