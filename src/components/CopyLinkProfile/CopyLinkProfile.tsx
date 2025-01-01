import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MdCopyAll } from "react-icons/md";

import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Button } from "assets/components/ui/button";

const CopyLinkProfile = () => {
  const { t } = useTranslation(["common", "toast"]);
  const profilePath = useAppSelector(selectUserAuth);
  return (
    <Button
      variant={"outline"}
      onClick={() => {
        navigator.clipboard.writeText(
          window.location.host + "/user/" + profilePath
        );
        toast.info(t("toast:info.copy_link"));
      }}
      className='z-40 m-auto flex max-w-[220px] flex-row items-center gap-2 border-dashed  text-center text-[0.7rem] click-behavior xs:text-xs'>
      <MdCopyAll className='text-[1rem]' />
      {t("common:button.link_copy_profile")}
    </Button>
  );
};

export default CopyLinkProfile;
