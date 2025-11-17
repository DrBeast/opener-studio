import React from "npm:react@18.3.1";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
  Link,
} from "npm:@react-email/components@0.0.22";
import { sharedStyles } from "./styles.ts";

interface BaseLayoutProps {
  preview?: string;
  heading?: string;
  showLogo?: boolean;
  logoUrl?: string;
  showFooter?: boolean;
  reason?: string;
  children: React.ReactNode;
}

export const BaseLayout = ({
  preview,
  heading,
  showLogo = true,
  logoUrl = "https://openerstudio.com/Logo_5_main_rs_cr.png",
  showFooter = true,
  reason = "You received this email because of a request regarding your Opener Studio account.",
  children,
}: BaseLayoutProps) => {
  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={sharedStyles.main}>
        <Container style={sharedStyles.container}>
          {/* Logo Section */}
          {showLogo && (
            <Section style={sharedStyles.logoSection}>
              <Img
                src={logoUrl}
                alt="Opener Studio Logo"
                width="150"
                style={sharedStyles.logo}
              />
            </Section>
          )}

          {/* Main Content Section */}
          <Section style={sharedStyles.contentSection}>
            {heading && <Text style={sharedStyles.heading}>{heading}</Text>}
            {children}

            {/* Standardized Footer Section */}
            {showFooter && (
              <>
                <Hr style={sharedStyles.footerHr} />
                <Section style={sharedStyles.footerSection}>
                  <Text style={sharedStyles.footer}>{reason}</Text>
                  <Text style={sharedStyles.footer}>
                    © 2025 Two Steps Ahead LLC
                  </Text>
                  <Text style={sharedStyles.footer}>
                    <Link
                      href="https://openerstudio.com"
                      style={sharedStyles.footerLink}
                    >
                      Website
                    </Link>
                    {" • "}
                    <Link
                      href="https://openerstudio.com/terms"
                      style={sharedStyles.footerLink}
                    >
                      Terms
                    </Link>
                    {" • "}
                    <Link
                      href="https://openerstudio.com/privacy"
                      style={sharedStyles.footerLink}
                    >
                      Privacy Policy
                    </Link>
                  </Text>
                </Section>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
