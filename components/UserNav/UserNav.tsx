import { logOut } from "feature/user/store/userSlice";
import Link from "next/link";
import { useAppDispatch } from "store/hooks";

const UserNav = () => {
  const dispatch = useAppDispatch();
  return(
  <div className='mt-3 text-base text-mainText'>
    <Link href='/settings'>
      <button>Edytuj</button>
    </Link>
    <button onClick={() => dispatch(logOut())} className='ml-3'>
      Wyloguj
    </button>
  </div>)
};
export default UserNav;
