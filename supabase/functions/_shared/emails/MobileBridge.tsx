import React from "npm:react@18.3.1";
import {
  Text,
  Button,
  Link,
  Section,
} from "npm:@react-email/components@0.0.22";
import { BaseLayout } from "./BaseLayout.tsx";
import { sharedStyles } from "./styles.ts";

interface MobileBridgeProps {
  actionUrl: string;
}

export const MobileBridgeEmail = ({ actionUrl }: MobileBridgeProps) => {
  return (
    <BaseLayout
      preview="Access Opener Studio on your computer"
      heading="Almost there!"
      reason="You received this because you requested a desktop link to Opener Studio."
    >
      <Text style={sharedStyles.paragraph}>
        Thanks for your interest in Opener Studio! We're excited to help you
        craft that perfect first message.
      </Text>
      <Text style={sharedStyles.paragraph}>
        Please click the button below to access the Studio on your computer:
      </Text>
      <Section style={sharedStyles.buttonContainer}>
        <Button style={sharedStyles.button} href={actionUrl}>
          Open on Desktop
        </Button>
      </Section>
      <Text style={sharedStyles.paragraphSmall}>
        or copy this link:{" "}
        <Link href={actionUrl} style={sharedStyles.link}>
          {actionUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
};
