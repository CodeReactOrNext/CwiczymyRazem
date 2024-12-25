import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { MdCopyAll } from "react-icons/md";

import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

const CopyLinkProfile = () => {
  const { t } = useTranslation(["common", "toast"]);
  const profilePath = useAppSelector(selectUserAuth);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(
          window.location.host + "/user/" + profilePath
        );
        toast.info(t("toast:info.copy_link"));
      }}
      className='content-box m-auto flex max-w-[220px] flex-row items-center gap-2 text-center font-openSans text-[0.7rem] text-mainText click-behavior active:scale-90 xs:text-xs'>
      <MdCopyAll className='text-[1rem]' />
      {t("common:button.link_copy_profile")}
    </button>
  );
};

export default CopyLinkProfile;
