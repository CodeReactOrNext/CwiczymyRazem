import { useTranslation } from "hooks/useTranslation";

interface UserStatsProps {
  currentPage: number;
  itemsPerPage: number;
  totalUsers: number;
}

const UserStats = ({
  currentPage,
  itemsPerPage,
  totalUsers,
}: UserStatsProps) => {
  const { t } = useTranslation("leadboard");

  if (!totalUsers) return null;

  return (
    <div className='font-openSans text-sm text-gray-600'>
      {`${t("showing")} ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
        currentPage * itemsPerPage,
        totalUsers
      )} ${t("of")} ${totalUsers} ${t("users")}`}
    </div>
  );
};

export default UserStats;
