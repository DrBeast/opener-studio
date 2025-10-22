// This file provides CORS headers for all edge functions

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

// Legacy static CORS headers (for backward compatibility)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
};