import { useTranslation } from "react-i18next";
import { FaHandPointLeft } from "react-icons/fa";
import { toast } from "react-toastify";

import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

const CopyLinkProfile = () => {
  const { t } = useTranslation(["common", "toast"]);
  const profilePath = useAppSelector(selectUserAuth);
  return (
    { profilePath } && (
      <button
        onClick={() => {
          navigator.clipboard.writeText(
            window.location.host + "/user/" + profilePath
          );
          toast.info(t("toast:info.copy_link"));
        }}
        className='flex flex-row items-center gap-2 py-2 font-openSans text-xs text-mainText click-behavior active:scale-90'>
        {t("common:button.link_copy_profile")} <FaHandPointLeft />
      </button>
    )
  );
};

export default CopyLinkProfile;