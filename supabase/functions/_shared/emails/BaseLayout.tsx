import React from "npm:react@18.3.1";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "npm:@react-email/components@0.0.22";
import { sharedStyles } from "./styles.ts";

interface BaseLayoutProps {
  preview?: string;
  heading?: string;
  children: React.ReactNode;
}

export const BaseLayout = ({
  preview,
  heading = "Opener Studio",
  children,
}: BaseLayoutProps) => {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={sharedStyles.main}>
        <Container style={sharedStyles.container}>
          <Section>
            {heading && <Text style={sharedStyles.heading}>{heading}</Text>}
            <Hr style={sharedStyles.hr} />
            {children}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
