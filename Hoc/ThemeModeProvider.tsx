import { selectLayoutMode } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useAppSelector(selectLayoutMode);

  return <div className={theme}> {children}</div>;
};

export default ThemeModeProvider;
