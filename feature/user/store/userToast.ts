import { toast } from "react-toastify";

export const updateUserEmailSuccess = () => {
  toast.success("Zmieniono email");
};

export const updateUserPasswordSuccess = () => {
  toast.success("Zmieniono hasło");
};

export const updateUserAvatarSuccess = () => {
  toast.success("Zmieniono awatar");
};

export const newUserInfo = (points: number) => {
  if (points === 0) {
    toast.info(
      'Zerknij do FAQ żeby dowiedzieć się jak używać "Ćwiczymy Razem"',
      {
        autoClose: 10000,
      }
    );
  }
};
