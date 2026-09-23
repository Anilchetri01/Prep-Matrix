import { handleGeminiProxyRequest } from '../server/geminiProxy.js';

export default async function handler(req, res) {
  const result = await handleGeminiProxyRequest({
    method: req.method,
    body: req.body,
  });

  Object.entries(result.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return res.status(result.status).json(result.body);
}
