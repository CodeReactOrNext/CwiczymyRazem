import * as yup from "yup";

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("yup_errors:valid_email")
    .required("yup_errors:required"),
  password: yup
    .string()
    .min(8, "yup_errors:password_char_number")
    .required("yup_errors:required"),
});
