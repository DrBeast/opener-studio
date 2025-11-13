import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { encode as encodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';
import { getAllResponseHeaders } from '../_shared/cors.ts';

// SMTP client using Deno's native capabilities
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<void> {
  // Get SMTP configuration from environment variables
  // These should be set in Supabase project settings -> Edge Functions -> Secrets
  const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPassword = Deno.env.get('SMTP_PASSWORD');
  const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

  if (!smtpUser || !smtpPassword) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in Supabase Edge Function secrets.');
  }

  // Use a simple SMTP library approach
  // For Google Workspace, we'll use the SMTP connection with TLS
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Create connection
  let conn: Deno.TcpConn | Deno.TlsConn;
  
  if (smtpPort === 465) {
    // SSL/TLS connection for port 465
    conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort });
  } else {
    // Start with plain connection for port 587 (will upgrade to TLS)
    conn = await Deno.connect({ hostname: smtpHost, port: smtpPort });
  }

  try {
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(4096);
      const n = await conn.read(buffer);
      if (n === null) throw new Error('Connection closed');
      return decoder.decode(buffer.subarray(0, n));
    };

    const writeCommand = async (cmd: string): Promise<void> => {
      await conn.write(encoder.encode(cmd + '\r\n'));
    };

    // Read initial greeting
    const greeting = await readResponse();
    if (!greeting.startsWith('220')) {
      throw new Error(`SMTP server error: ${greeting}`);
    }

    // Send EHLO
    await writeCommand(`EHLO ${smtpHost}`);
    await readResponse();
    
    // Start TLS if using port 587
    if (smtpPort === 587) {
      await writeCommand('STARTTLS');
      const tlsResponse = await readResponse();
      if (!tlsResponse.startsWith('220')) {
        throw new Error(`STARTTLS failed: ${tlsResponse}`);
      }
      
      // Upgrade to TLS
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtpHost });
      
      // Send EHLO again after TLS
      await writeCommand(`EHLO ${smtpHost}`);
      await readResponse();
    }

    // Authenticate
    await writeCommand('AUTH LOGIN');
    await readResponse();
    
    // Encode credentials in base64 for SMTP AUTH LOGIN
    const encoder = new TextEncoder();
    await writeCommand(encodeBase64(encoder.encode(smtpUser)));
    await readResponse();
    
    await writeCommand(encodeBase64(encoder.encode(smtpPassword)));
    const authResponse = await readResponse();
    if (!authResponse.startsWith('235')) {
      throw new Error(`SMTP authentication failed: ${authResponse}`);
    }

    // Send email
    await writeCommand(`MAIL FROM:<${smtpFrom}>`);
    await readResponse();
    
    await writeCommand(`RCPT TO:<${to}>`);
    await readResponse();
    
    await writeCommand('DATA');
    await readResponse();

    // Email headers and body
    const emailContent = `From: ${smtpFrom}
To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

${htmlBody}
.`;

    await writeCommand(emailContent);
    const dataResponse = await readResponse();
    if (!dataResponse.startsWith('250')) {
      throw new Error(`SMTP send failed: ${dataResponse}`);
    }

    // Quit
    await writeCommand('QUIT');
    await readResponse();
  } finally {
    conn.close();
  }
}

serve(async (req) => {
  const corsHeaders = getAllResponseHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Email content
    const subject = 'Your Opener Studio Link';
    const magicLink = 'https://openerstudio.com';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a5568;">Your Opener Studio Link</h2>
            <p>Thanks for your interest in Opener Studio!</p>
            <p>Click the link below to access the Studio on your computer:</p>
            <p style="margin: 30px 0;">
              <a href="${magicLink}" 
                 style="background-color: #6366f1; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Open Opener Studio
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${magicLink}" style="color: #6366f1;">${magicLink}</a>
            </p>
          </div>
        </body>
      </html>
    `;
    const textBody = `Thanks for your interest in Opener Studio!

Click this link to access the Studio on your computer:
${magicLink}`;

    // Send email via SMTP
    await sendEmailViaSMTP(email, subject, htmlBody, textBody);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

