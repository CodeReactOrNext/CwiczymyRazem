const ThemeModeProvider = ({ children }: { children: React.ReactNode }) => {
  return <div className='dark-theme'> {children}</div>;
};

export default ThemeModeProvider;
