import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import EmailFooter from "./EmailFooter";

/**
 * One look for every email: black page, logo row, a flat illustration, then
 * a short column of text with at most one card and one key-style button.
 * Everything is inline styles and tables, because that is what mail clients
 * render; no gradients or overlays, which Outlook drops.
 */

export const emailColors = {
  bg: "#09090b",
  card: "#18181b",
  cardRaised: "#27272a",
  text: "#f4f4f5",
  textMuted: "#a1a1aa",
  textDim: "#8b8b94",
  textFaint: "#52525b",
  amber: "#f5b83d",
};

export const monoFont =
  'ui-monospace, Menlo, Consolas, "Courier New", monospace';

const sansFont =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Public, absolute URL of one of the illustrations in public/images/email. */
export type EmailArt =
  | "welcome"
  | "streak-d1"
  | "streak-d3"
  | "season-start"
  | "season-ending"
  | "results-ranked"
  | "results-unranked";

const ASSET_BASE = "https://riff.quest/images/email";

export const emailArtUrl = (art: EmailArt) => `${ASSET_BASE}/${art}.jpg`;

/** "You're in, Kuba." or "You're in." when we don't know the name. */
export const withName = (text: string, userName?: string | null) => {
  const name = userName?.trim();
  return name ? `${text}, ${name}.` : `${text}.`;
};

export const formatNumber = (n: number) => n.toLocaleString("en-US");

const body: CSSProperties = {
  backgroundColor: emailColors.bg,
  color: emailColors.text,
  fontFamily: sansFont,
  margin: 0,
  padding: 0,
};

const container: CSSProperties = {
  maxWidth: "600px",
  width: "100%",
  margin: "0 auto",
  backgroundColor: emailColors.bg,
};

const art: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "600px",
  height: "auto",
  border: 0,
};

const content: CSSProperties = {
  padding: "8px 40px 48px",
};

interface EmailLayoutProps {
  preview: string;
  logoUrl: string;
  art: EmailArt;
  /** Why this reader got the email, as one sentence. */
  reason: ReactNode;
  preferencesUrl: string;
  children: ReactNode;
}

export default function EmailLayout({
  preview,
  logoUrl,
  art: artName,
  reason,
  preferencesUrl,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang='en'>
      <Head>
        <meta name='color-scheme' content='dark' />
        <meta name='supported-color-schemes' content='dark' />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ padding: "36px 40px 0" }}>
            <Img
              src={logoUrl}
              alt='Riff Quest'
              width='143'
              height='22'
              style={{ display: "block", border: 0 }}
            />
          </Section>
          <Img
            src={emailArtUrl(artName)}
            alt=''
            width='600'
            height='300'
            style={art}
          />
          <Section style={content}>
            {children}
            <EmailFooter preferencesUrl={preferencesUrl}>{reason}</EmailFooter>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// --- Building blocks. Each one carries its own bottom spacing (36px between
// --- blocks, 16px inside the intro), so templates just stack them.

export function EmailIntro({
  eyebrow,
  title,
  big = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** The results emails lead with the place, so their heading is larger. */
  big?: boolean;
  children: ReactNode;
}) {
  return (
    <Section style={{ marginBottom: "36px" }}>
      {eyebrow && (
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: "13px",
            lineHeight: "20px",
            color: emailColors.amber,
            margin: "0 0 16px",
          }}>
          {eyebrow}
        </Text>
      )}
      <Heading
        as='h1'
        style={{
          margin: "0 0 16px",
          fontSize: big ? "44px" : "34px",
          lineHeight: big ? "48px" : "40px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: emailColors.text,
        }}>
        {title}
      </Heading>
      <Text
        style={{
          margin: 0,
          fontSize: "16px",
          lineHeight: "26px",
          color: emailColors.textMuted,
        }}>
        {children}
      </Text>
    </Section>
  );
}

export function EmailCard({
  children,
  padding = "28px",
}: {
  children: ReactNode;
  padding?: string;
}) {
  return (
    <Section
      style={{
        backgroundColor: emailColors.card,
        borderRadius: "12px",
        padding,
        marginBottom: "36px",
      }}>
      {children}
    </Section>
  );
}

/** Light key with a lip, the same pressable look the app's buttons have. */
export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ marginBottom: "36px" }}>
      <Button
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: emailColors.text,
          color: emailColors.bg,
          padding: "14px 28px",
          borderRadius: "8px",
          borderBottom: "4px solid #a1a1aa",
          fontSize: "15px",
          lineHeight: "20px",
          fontWeight: 700,
          textDecoration: "none",
        }}>
        {children}
      </Button>
    </Section>
  );
}

export function EmailNote({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 36px",
        fontSize: "15px",
        lineHeight: "24px",
        color: emailColors.textMuted,
      }}>
      {children}
    </Text>
  );
}
