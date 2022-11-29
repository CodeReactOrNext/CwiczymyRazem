import { useDispatch } from "react-redux";
import Button from "components/Button";
import Input from "components/Input";
import MainLayout from "layouts/MainLayout";
import { FaUserAlt, FaLock, FaAt } from "react-icons/fa";
import FormLayout from "layouts/FormLayout";
import { useTranslation } from "react-i18next";

const SingupView = () => {
  const { t } = useTranslation(["common", "signup"]);

  return (
    <MainLayout subtitle={t("signup:subtitlebar_text")} variant='primary'>
      <FormLayout>
        <>
          <Input Icon={FaUserAlt} placeholder={t("common:input.login")} />
          <Input Icon={FaAt} placeholder={t("common:input.email")} />
          <Input Icon={FaLock} placeholder={t("common:input.password")} />
          <Input
            Icon={FaLock}
            placeholder={t("common:input.repeat_password")}
          />
          <div className='flex space-x-1 '>
            <Button>{t("common:button.sign_up")}</Button>
          </div>
        </>
      </FormLayout>
    </MainLayout>
  );
};

export default SingupView;
