import { useTranslation } from "react-i18next";
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
        className='flex flex-row items-center gap-2 content-box font-openSans text-[0.6rem] text-mainText click-behavior active:scale-90 xs:text-xs'>
        {t("common:button.link_copy_profile")}
      </button>
    )
  );
};

export default CopyLinkProfile;
