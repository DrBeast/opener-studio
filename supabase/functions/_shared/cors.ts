// This file provides CORS and security headers for all edge functions

// Define allowed origins
const ALLOWED_ORIGINS = [
  'https://openerstudio.com',
  'https://beta.openerstudio.com',
  'https://dev-opener-studio.vercel.app',
  'http://localhost:8080',
  'http://localhost:8081'
];

// Function to get dynamic CORS headers based on request origin
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin');
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
  
  const corsHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  if (isAllowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }
  
  return corsHeaders;
}

// Security headers for all edge function responses
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

// Combined function for all response headers
export function getAllResponseHeaders(req: Request) {
  return {
    ...getCorsHeaders(req),
    ...getSecurityHeaders()
  };
}