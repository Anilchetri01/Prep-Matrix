import { corsHeaders } from '../_shared/cors.ts';

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const responsePayload = {
    status: 'healthy',
    service: 'prep-matrix-edge-runtime',
    timestamp: new Date().toISOString(),
    denoVersion: Deno.version.deno,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
});
