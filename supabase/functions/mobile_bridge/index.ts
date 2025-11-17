import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getAllResponseHeaders } from '../_shared/cors.ts';
import { render } from 'npm:@react-email/render@0.0.15';
import React from 'npm:react@18.3.1';
import { MobileBridgeEmail } from '../_shared/emails/MobileBridge.tsx';

serve(async (req) => {
  const corsHeaders = getAllResponseHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured. Please set it in Supabase Edge Function secrets.');
    }

    // Get sender email (should be a verified domain/email in Resend)
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'hello@openerstudio.com';

    // Email content
    const subject = 'Your Opener Studio Link';
    const magicLink = 'https://openerstudio.com';
    
    // Render React Email template to HTML
    const htmlBody = await render(
      React.createElement(MobileBridgeEmail, { actionUrl: magicLink })
    );

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
      throw new Error(errorData.message || `Resend API error: ${resendResponse.status}`);
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});