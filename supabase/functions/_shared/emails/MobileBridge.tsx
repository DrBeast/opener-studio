import React from "npm:react@18.3.1";
import { Text, Button, Link } from "npm:@react-email/components@0.0.22";
import { BaseLayout } from "./BaseLayout.tsx";
import { sharedStyles } from "./styles.ts";

interface MobileBridgeProps {
  actionUrl: string;
}

export const MobileBridgeEmail = ({ actionUrl }: MobileBridgeProps) => {
  return (
    <BaseLayout preview="Access Opener Studio on your computer">
      <Text style={sharedStyles.paragraph}>
        Thanks for your interest in Opener Studio! Click the button below to
        access the Studio on your computer.
      </Text>
      <Button style={sharedStyles.button} href={actionUrl}>
        Open on Desktop
      </Button>
      <Text style={sharedStyles.footer}>
        or copy this link:{" "}
        <Link href={actionUrl} style={sharedStyles.link}>
          {actionUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
};
