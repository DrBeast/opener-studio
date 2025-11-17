import React from "npm:react@18.3.1";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from "npm:@react-email/components@0.0.22";

interface MobileBridgeProps {
  actionUrl: string;
}

export const MobileBridgeEmail = ({ actionUrl }: MobileBridgeProps) => {
  return (
    <Html>
      <Head />
      <Preview>Access Opener Studio on your computer</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Opener Studio</Text>
            <Hr style={hr} />
            <Text style={paragraph}>
              Thanks for your interest in Opener Studio! Click the button below
              to access the Studio on your computer.
            </Text>
            <Button style={button} href={actionUrl}>
              Open on Desktop
            </Button>
            <Text style={footer}>
              or copy this link: <Link href={actionUrl}>{actionUrl}</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Simple styles (inline CSS is required for email)
const main = { backgroundColor: "#ffffff", fontFamily: "sans-serif" };
const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};
const heading = { fontSize: "32px", fontWeight: "bold", color: "#000000" };
const paragraph = { fontSize: "16px", lineHeight: "26px", color: "#333333" };
const button = {
  backgroundColor: "#6366f1",
  borderRadius: "6px",
  color: "#fff",
  padding: "12px 24px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#cccccc", margin: "20px 0" };
const footer = { color: "#8898aa", fontSize: "12px", marginTop: "20px" };
