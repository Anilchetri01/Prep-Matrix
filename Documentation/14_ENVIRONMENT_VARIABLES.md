# Document 14 — Environment Variables Reference

**Project**: PrepMatrix  
**Document Version**: 1.0.0  
**Status**: Production Reference  
**Auditor**: Senior DevOps Engineer / Application Security Engineer  
**Last Updated**: September 24, 2026  

---

## 1. Overview & Security Classification

PrepMatrix segregates environment variables into two distinct execution scopes:
1. **Client-Side / Browser Scope (`VITE_*`)**: Variables prefixed with `VITE_` are statically embedded into client JavaScript bundles at compile time by Vite. **Never place private keys, database passwords, or service-role keys in `VITE_` variables.**
2. **Server-Side / Serverless Scope (`GEMINI_*`)**: Variables without the `VITE_` prefix remain accessible only within server-side execution contexts (Vercel Serverless Functions in `api/` and the Vite dev server proxy in `vite.config.ts`).

---

## 2. Environment Variables Inventory

| Variable Name | Required? | Target Scope | Purpose & Description | Secret? | Example Placeholder | Code Evidence |
|---|---|---|---|---|---|---|
| **`VITE_SUPABASE_URL`** | **Yes** | Client (Browser) | Public HTTPS URL of the Supabase project instance | No (Public) | `https://your-project.supabase.co` | `src/lib/supabaseClient.ts#L5` |
| **`VITE_SUPABASE_ANON_KEY`** | **Yes** | Client (Browser) | Public anonymous key for Supabase PostgREST queries guarded by RLS | No (Public) | `eyJhbGciOiJIUzI1NiIsInR5cCI...` | `src/lib/supabaseClient.ts#L6` |
| **`GEMINI_API_KEY`** | **Yes** | Serverless / Server | Upstream Google Gemini API key used by the serverless proxy | **YES (CONFIDENTIAL)** | `AIzaSyYourGeminiApiKey...` | `Frontend/PrepMatrix/server/geminiProxy.js#L208` |
| **`GEMINI_MODEL`** | No | Serverless / Server | Upstream model identifier. Defaults to `gemini-2.5-flash` if omitted | No | `gemini-2.5-flash` | `Frontend/PrepMatrix/server/geminiProxy.js#L11` |
| **`VITE_EMAILJS_SERVICE_ID`** | No | Client (Browser) | EmailJS service identifier for contact form forwarding | No | `service_yourServiceId` | `Frontend/PrepMatrix/.env.example#L10` |
| **`VITE_EMAILJS_TEMPLATE_ID`**| No | Client (Browser) | EmailJS template identifier for email formatting | No | `template_yourTemplateId` | `Frontend/PrepMatrix/.env.example#L11` |
| **`VITE_EMAILJS_PUBLIC_KEY`** | No | Client (Browser) | EmailJS account public key for browser dispatch | No | `yourEmailJsPublicKey` | `Frontend/PrepMatrix/.env.example#L12` |

---

## 3. Configuration Setup & Provisioning

### 3.1 Local Development (`.env`)
Create a `.env` file at the root of the frontend application (`Frontend/PrepMatrix/.env`):

```bash
# ------------------------------------------------------------------------------
# Supabase Configuration (Browser Client)
# ------------------------------------------------------------------------------
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# ------------------------------------------------------------------------------
# Gemini AI Configuration (Serverless Proxy Only)
# ------------------------------------------------------------------------------
GEMINI_API_KEY=YOUR_AI_API_KEY
GEMINI_MODEL=gemini-2.5-flash

# ------------------------------------------------------------------------------
# EmailJS Configuration (Optional)
# ------------------------------------------------------------------------------
# VITE_EMAILJS_SERVICE_ID=YOUR_EMAILJS_SERVICE_ID
# VITE_EMAILJS_TEMPLATE_ID=YOUR_EMAILJS_TEMPLATE_ID
# VITE_EMAILJS_PUBLIC_KEY=YOUR_EMAILJS_PUBLIC_KEY
```

### 3.2 Vercel Production Settings
When deploying on Vercel:
1. Open the project in the [Vercel Dashboard](https://vercel.com/).
2. Navigate to **Settings** -> **Environment Variables**.
3. Add the following variables:
   - `VITE_SUPABASE_URL` (Applied to: Production, Preview, Development)
   - `VITE_SUPABASE_ANON_KEY` (Applied to: Production, Preview, Development)
   - `GEMINI_API_KEY` (Applied to: Production, Preview, Development)
   - `GEMINI_MODEL` (Applied to: Production, Preview, Development)
4. Trigger a project redeploy so the environment variables take effect.

### 3.3 GitHub Actions CI Secrets
For automated pull request and push workflows in GitHub Actions (`.github/workflows/ci.yml`), configure repository secrets under **Settings** -> **Secrets and variables** -> **Actions**:
- `VITE_SUPABASE_URL`: Required for the `npm run build` step.
- `VITE_SUPABASE_ANON_KEY`: Required for the `npm run build` step.

---

## 4. Security Rules for Credentials

1. **Never Commit `.env`**: Ensure `Frontend/PrepMatrix/.env` is ignored by `.gitignore`.
2. **Never Expose `SUPABASE_SERVICE_ROLE_KEY`**: PrepMatrix does not require the Supabase service-role key in any client or serverless code. Never add it to environment files.
3. **Guard `GEMINI_API_KEY`**: Do not prepend `VITE_` to `GEMINI_API_KEY`. The variable must remain server-side so it is never compiled into browser scripts.
