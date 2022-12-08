import * as yup from "yup";
import { passwordRegexRules } from "schemas/passwordRules";

export const signupSchema = yup.object().shape({
  login: yup.string().min(3).required("yup_errors:required"),
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
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "yup_errors:same_passwords")
    .required("yup_errors:required"),
});
