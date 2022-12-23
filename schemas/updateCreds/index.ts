import * as yup from "yup";
import { passwordRegexRules } from "schemas/passwordRules";

export const updateCredsSchema = yup.object().shape({
  login: yup.string().min(3).required("yup_errors:required"),
  email: yup.string().email("yup_errors:valid_email"),
  password: yup
    .string()
    .min(8, "yup_errors:password_char_number")
    .matches(passwordRegexRules, {
      message: "yup_errors:stronger_password",
    }),
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "yup_errors:same_passwords"),
});
