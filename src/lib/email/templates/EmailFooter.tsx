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
  color: "#71717a",
  textAlign: "center" as const,
  marginTop: "28px",
  lineHeight: "18px",
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
      <br />
      Riff Quest. Practice. Progress. Play.
    </Text>
  );
}
