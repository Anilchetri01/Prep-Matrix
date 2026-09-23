import { corsHeaders } from '../_shared/cors.ts';

const STABLE_MODEL = 'gemini-2.5-flash';
const MODEL_PATTERN = /^gemini-[a-z0-9.\-]+$/i;
const GEMINI_REQUEST_TIMEOUT_MS = 25_000;
const GEMINI_MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveModel(model?: string): string {
  if (model && MODEL_PATTERN.test(model.trim())) {
    return model.trim();
  }
  const configured = Deno.env.get('GEMINI_MODEL') || '';
  return MODEL_PATTERN.test(configured.trim()) ? configured.trim() : STABLE_MODEL;
}

function jsonResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function sendError(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return jsonResponse(status, {
    message,
    error: {
      status,
      message,
      ...extra,
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return sendError(405, `Method ${req.method} not allowed`);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!apiKey) {
    return sendError(500, 'GEMINI_API_KEY secret is not configured in Supabase Edge Functions');
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return sendError(400, 'Invalid JSON body');
  }

  const model = resolveModel(typeof body.model === 'string' ? body.model : undefined);
  const contents = body.contents;
  if (!Array.isArray(contents) || contents.length === 0) {
    return sendError(400, 'contents must be a non-empty array');
  }

  const upstreamPayload: Record<string, unknown> = {
    contents,
  };

  if (body.generationConfig && typeof body.generationConfig === 'object') {
    upstreamPayload.generationConfig = body.generationConfig;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let lastError: Error | null = null;
  let lastStatus = 500;

  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const waitTime = RETRY_DELAYS_MS[attempt - 1] || 2_000;
      await delay(waitTime);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upstreamPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseJson: unknown = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = null;
      }

      if (response.ok) {
        return jsonResponse(200, responseJson ?? { message: responseText });
      }

      lastStatus = response.status;
      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === GEMINI_MAX_RETRIES) {
        return jsonResponse(response.status, responseJson ?? { error: { message: responseText } });
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (err as Error)?.name === 'AbortError';
      lastError = isAbort ? new Error('Gemini API request timed out') : (err as Error);

      if (attempt === GEMINI_MAX_RETRIES) {
        return sendError(504, lastError.message || 'Gemini upstream request failed');
      }
    }
  }

  return sendError(lastStatus, lastError?.message || 'Gemini proxy request failed after retries');
});
