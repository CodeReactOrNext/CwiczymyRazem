import { changeTheme, selectLayoutMode } from "feature/user/store/userSlice";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectLayoutMode);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("userSlice.theme")) {
        dispatch(
          changeTheme(JSON.parse(localStorage.getItem("userSlice.theme")!))
        );
      }
    }
  }, [, dispatch]);
  return <div className={theme}> {children}</div>;
};

export default ThemeModeProvider;
