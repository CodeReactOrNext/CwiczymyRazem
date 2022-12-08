import * as yup from "yup";
import { passwordRegexRules } from "schemas/passwordRules";

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("yup_errors:valid_email")
    .required("yup_errors:required"),
  password: yup
    .string()
    .min(8, "yup_errors:password_char_number")
    .matches(passwordRegexRules, {
      message: "yup_errors:stronger_password",
    })
    .required("yup_errors:required"),
});
