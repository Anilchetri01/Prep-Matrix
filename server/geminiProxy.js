const STABLE_MODEL = 'gemini-2.5-flash';
const MODEL_PATTERN = /^gemini-[a-z0-9.\-]+$/i;

const GEMINI_TOTAL_TIMEOUT_MS = 30_000;
const GEMINI_REQUEST_TIMEOUT_MS = 12_000;
const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_DELAYS_MS = [1_000, 2_000, 4_000];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);

function getDefaultModel() {
  const configuredModel = (process.env.GEMINI_MODEL || '').trim();
  return MODEL_PATTERN.test(configuredModel) ? configuredModel : STABLE_MODEL;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
  return RETRYABLE_STATUS_CODES.has(status);
}

function isRetryableError(error) {
  return error?.name === 'AbortError' || error instanceof TypeError;
}

function serializeError(error) {
  if (!error || typeof error !== 'object') {
    return { message: String(error || 'Unknown error') };
  }

  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };
}

function summarizeRequestPayload(payload) {
  const contents = Array.isArray(payload?.contents) ? payload.contents : [];
  const partCount = contents.reduce(
    (count, content) => count + (Array.isArray(content?.parts) ? content.parts.length : 0),
    0,
  );

  return {
    contentCount: contents.length,
    generationConfigKeys:
      payload?.generationConfig && typeof payload.generationConfig === 'object'
        ? Object.keys(payload.generationConfig)
        : [],
    model: typeof payload?.model === 'string' ? payload.model : undefined,
    partCount,
  };
}

function resolveModel(model) {
  if (typeof model === 'string' && MODEL_PATTERN.test(model.trim())) {
    return model.trim();
  }

  return getDefaultModel();
}

function normalizeErrorMessage(payload, fallbackMessage, rawText = '') {
  if (payload && typeof payload === 'object') {
    return payload.error?.message || payload.message || fallbackMessage;
  }

  return rawText.trim() || fallbackMessage;
}

async function readJsonResponse(response) {
  const rawText = await response.text().catch(() => '');

  if (!rawText) {
    return { payload: null, rawText: '' };
  }

  try {
    return {
      payload: JSON.parse(rawText),
      rawText,
    };
  } catch {
    return {
      payload: null,
      rawText,
    };
  }
}

function jsonResponse(status, body, headers = {}) {
  return {
    body,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
    status,
  };
}

function sendError(status, message, extra = {}, headers = {}) {
  return jsonResponse(
    status,
    {
      message,
      error: {
        status,
        message,
        ...extra,
      },
    },
    headers,
  );
}

function getRequestBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  if (typeof body === 'object') {
    return body;
  }

  return null;
}

function normalizeContents(contents) {
  if (!Array.isArray(contents) || contents.length === 0) {
    return null;
  }

  const normalizedContents = contents
    .map((content) => {
      const parts = Array.isArray(content?.parts)
        ? content.parts
            .map((part) => ({
              text: typeof part?.text === 'string' ? part.text.trim() : '',
            }))
            .filter((part) => part.text)
        : [];

      return parts.length > 0 ? { parts } : null;
    })
    .filter(Boolean);

  return normalizedContents.length > 0 ? normalizedContents : null;
}

function normalizeGenerationConfig(generationConfig) {
  if (!generationConfig || typeof generationConfig !== 'object' || Array.isArray(generationConfig)) {
    return null;
  }

  return generationConfig;
}

async function requestGeminiUpstream({
  apiKey,
  requestPayload,
  timeoutMs,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        requestPayload.model,
      )}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: requestPayload.contents,
          generationConfig: requestPayload.generationConfig,
        }),
      },
    );

    const { payload, rawText } = await readJsonResponse(response);
    return { response, payload, rawText };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function handleGeminiProxyRequest({ method, body }) {
  if (method !== 'POST') {
    return sendError(405, 'Method not allowed.', {}, { Allow: 'POST' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError(500, 'GEMINI_API_KEY is not configured on the server.');
  }

  try {
    const parsedBody = getRequestBody(body);
    if (!parsedBody || typeof parsedBody !== 'object') {
      return sendError(400, 'Request body must be valid JSON.');
    }

    const resolvedModel = resolveModel(parsedBody.model);
    const contents = normalizeContents(parsedBody.contents);
    const generationConfig = normalizeGenerationConfig(parsedBody.generationConfig);

    if (!contents) {
      console.error('[api/gemini] validation_error', {
        message: 'Request body must include Gemini contents.',
        requestPayload: summarizeRequestPayload(parsedBody),
      });
      return sendError(400, 'Request body must include Gemini contents.');
    }

    if (!generationConfig) {
      console.error('[api/gemini] validation_error', {
        message: 'Request body must include a Gemini generationConfig object.',
        requestPayload: summarizeRequestPayload(parsedBody),
      });
      return sendError(400, 'Request body must include a Gemini generationConfig object.');
    }

    const requestPayload = {
      model: resolvedModel,
      contents,
      generationConfig,
    };

    const deadline = Date.now() + GEMINI_TOTAL_TIMEOUT_MS;
    let lastFailure = null;

    for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt += 1) {
      const remainingBudgetMs = deadline - Date.now();

      if (remainingBudgetMs <= 0) {
        break;
      }

      const timeoutMs = Math.min(remainingBudgetMs, GEMINI_REQUEST_TIMEOUT_MS);

      try {
        const { response, payload, rawText } = await requestGeminiUpstream({
          apiKey,
          requestPayload,
          timeoutMs,
        });

        if (response.ok && payload) {
          return jsonResponse(200, payload);
        }

        const fallbackStatus = response.ok ? 502 : response.status;
        const message = response.ok
          ? 'Gemini returned an invalid JSON response.'
          : normalizeErrorMessage(payload, 'Gemini request failed.', rawText);
        const retryable = isRetryableStatus(fallbackStatus);

        lastFailure = {
          attempt: attempt + 1,
          message,
          payload,
          rawText,
          status: fallbackStatus,
        };

        console.error('[api/gemini] upstream_error', {
          attempt: attempt + 1,
          model: resolvedModel,
          retryable,
          status: fallbackStatus,
          message,
          requestPayload: summarizeRequestPayload(requestPayload),
          responseError: payload?.error?.message || rawText.slice(0, 500),
        });

        if (!retryable || attempt === GEMINI_MAX_RETRIES) {
          if (payload && typeof payload === 'object') {
            return jsonResponse(fallbackStatus, {
              ...payload,
              message,
              error: {
                status: fallbackStatus,
                message,
                attempt: attempt + 1,
                retryable,
                ...(payload.error && typeof payload.error === 'object' ? payload.error : {}),
              },
            });
          }

          return sendError(fallbackStatus, message, {
            attempt: attempt + 1,
            retryable,
          });
        }
      } catch (error) {
        const timeout = error?.name === 'AbortError';
        const retryable = isRetryableError(error);
        const status = timeout ? 504 : 502;
        const message = timeout
          ? 'Gemini request timed out.'
          : 'Unable to reach Gemini right now.';

        lastFailure = {
          attempt: attempt + 1,
          error,
          message,
          status,
        };

        console.error('[api/gemini] request_error', {
          attempt: attempt + 1,
          model: resolvedModel,
          retryable,
          status,
          message,
          requestPayload: summarizeRequestPayload(requestPayload),
          error: serializeError(error),
        });

        if (!retryable || attempt === GEMINI_MAX_RETRIES) {
          return sendError(status, message, {
            attempt: attempt + 1,
            retryable,
          });
        }
      }

      const retryDelayMs = GEMINI_RETRY_DELAYS_MS[attempt];
      if (typeof retryDelayMs !== 'number') {
        break;
      }

      const timeRemainingAfterAttempt = deadline - Date.now();
      if (timeRemainingAfterAttempt <= retryDelayMs) {
        break;
      }

      await delay(retryDelayMs);
    }

    return sendError(
      lastFailure?.status || 504,
      lastFailure?.message || 'Gemini request timed out.',
      {
        attempt: lastFailure?.attempt || 0,
      },
    );
  } catch (error) {
    console.error('[api/gemini] unexpected_error', {
      error: serializeError(error),
    });
    return sendError(500, 'Unexpected Gemini proxy failure.');
  }
}
