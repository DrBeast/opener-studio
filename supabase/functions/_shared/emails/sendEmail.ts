import { render } from "npm:@react-email/render@0.0.15";
import React from "npm:react@18.3.1";

interface SendEmailOptions {
  to: string;
  subject: string;
  component: React.ComponentType<any>;
  props: Record<string, any>;
  resendApiKey: string;
  fromEmail: string;
}

export async function sendEmail({
  to,
  subject,
  component,
  props,
  resendApiKey,
  fromEmail,
}: SendEmailOptions) {
  // Render React Email template to HTML
  const htmlBody = await render(React.createElement(component, props));

  // Send email via Resend API
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html: htmlBody,
    }),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Resend API error: ${resendResponse.status}`
    );
  }

  return await resendResponse.json();
}

