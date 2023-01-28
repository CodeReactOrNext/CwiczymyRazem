import * as yup from "yup";

export const updateCredsSchema = yup.object().shape({
  login: yup
    .string()
    .min(3, "yup_errors:username_char_number")
    .max(28, "yup_errors:username_char_max_number")
    .matches(/^[^\s]+(\s+[^\s]+)*$/, "yup_errors:no_ends_whitespace")
    .required("yup_errors:required"),
  email: yup.string().email("yup_errors:valid_email"),
  password: yup.string().min(8, "yup_errors:password_char_number"),
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "yup_errors:same_passwords"),
});
