import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getAllResponseHeaders } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/emails/sendEmail.ts';
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
    
    // Send email using shared helper
    const resendData = await sendEmail({
      to: email,
      subject: subject,
      component: MobileBridgeEmail,
      props: { actionUrl: magicLink },
      resendApiKey,
      fromEmail,
    });

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