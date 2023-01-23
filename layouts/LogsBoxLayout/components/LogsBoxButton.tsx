interface LogsBoxButtonProps {
  title: string;
  active: boolean;
  onClick: () => void;
}

const LogsBoxButton = ({ title, active, onClick }: LogsBoxButtonProps) => {
  return (
    <button
      className={`bg-opacity-80 p-2 radius-default hover:bg-main-opposed-100
      ${active ? "bg-main-opposed-200 " : ""}`}
      onClick={onClick}>
      {title}
    </button>
  );
};

export default LogsBoxButton;
