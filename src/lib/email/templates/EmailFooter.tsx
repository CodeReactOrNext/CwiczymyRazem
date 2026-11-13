import { Link, Text } from "@react-email/components";
import type { ReactNode } from "react";

interface EmailFooterProps {
  /** Why this reader got the email, as one sentence. */
  children: ReactNode;
  /** The email tab of Settings, where every optional email can be turned off. */
  preferencesUrl: string;
}

const footer = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#8b8b94",
  margin: 0,
};

const link = {
  color: "#a1a1aa",
  textDecoration: "underline",
};

export default function EmailFooter({
  children,
  preferencesUrl,
}: EmailFooterProps) {
  return (
    <Text style={footer}>
      {children}
      <br />
      <Link href={preferencesUrl} style={link}>
        Manage email preferences
      </Link>
    </Text>
  );
}
