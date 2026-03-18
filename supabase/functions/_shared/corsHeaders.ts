// Centralized CORS headers for all edge functions
const ALLOWED_ORIGINS = [
  'https://astryd-ideas.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

export function getCorsHeaders(req?: Request): Record<string, string> {
  let origin = '*';
  
  if (req) {
    const requestOrigin = req.headers.get('origin');
    if (requestOrigin && ALLOWED_ORIGINS.some(allowed => requestOrigin.startsWith(allowed))) {
      origin = requestOrigin;
    } else if (requestOrigin && requestOrigin.includes('lovable.app')) {
      // Allow all lovable.app preview subdomains
      origin = requestOrigin;
    }
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}
