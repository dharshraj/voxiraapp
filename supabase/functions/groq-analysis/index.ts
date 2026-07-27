/**
 * Supabase Edge Function: groq-analysis
 *
 * Proxies speech-analysis chat requests to the Groq API using a server-side
 * API key so the key never appears in the client bundle.
 *
 * Model: llama-3.3-70b-versatile (fast, free tier available on Groq)
 * Base URL: https://api.groq.com/openai/v1  (OpenAI-compatible)
 *
 * Secrets required (run once):
 *   supabase secrets set GROQ_API_KEY=gsk_...
 *
 * Deploy:
 *   supabase functions deploy groq-analysis
 *
 * Request body:
 *   { messages: [{role, content}][], model?: string, max_tokens?: number, temperature?: number }
 *
 * Response: mirrors the OpenAI chat completions shape so the client can use
 *   data.choices[0].message.content as a drop-in replacement.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROQ_KEY  = Deno.env.get('GROQ_API_KEY') ?? '';
const GROQ_BASE = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Map Groq HTTP status codes to user-readable messages. */
function groqErrorMessage(status: number, body: string): string {
  if (status === 401) return 'Groq API key is invalid or not configured on the server.';
  if (status === 429) {
    // Groq returns a specific message for rate limits vs. quota
    if (body.includes('rate_limit')) return 'Groq rate limit reached — please wait a moment and try again.';
    return 'Groq quota exceeded — check your Groq account usage limits.';
  }
  if (status === 400) return `Groq rejected the request (bad parameters): ${body.slice(0, 200)}`;
  if (status >= 500) return `Groq server error (${status}) — please try again shortly.`;
  return `Groq API error ${status}: ${body.slice(0, 200)}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // Require authentication header (automatically sent by supabase.functions.invoke)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!GROQ_KEY) {
      console.error('[groq-analysis] GROQ_API_KEY secret is not configured');
      return new Response(JSON.stringify({
        error: 'GROQ_API_KEY is not configured on the server. Run: supabase secrets set GROQ_API_KEY=gsk_...',
      }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const {
      messages,
      model       = DEFAULT_MODEL,
      max_tokens  = 1000,
      temperature = 0.4,   // lower temp = more consistent JSON output
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[groq-analysis] Sending request to Groq:', model, '| messages:', messages.length);

    const upstream = await fetch(`${GROQ_BASE}/chat/completions`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
      signal: AbortSignal.timeout(28_000),  // edge function limit headroom
    });

    const responseText = await upstream.text();

    if (!upstream.ok) {
      const userMsg = groqErrorMessage(upstream.status, responseText);
      console.error('[groq-analysis] Groq error', upstream.status, responseText.slice(0, 300));
      return new Response(JSON.stringify({
        error:      userMsg,
        groq_status: upstream.status,
      }), { status: upstream.status, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[groq-analysis] Failed to parse Groq response:', responseText.slice(0, 200));
      return new Response(JSON.stringify({ error: 'Groq returned an unparseable response' }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[groq-analysis] Success — tokens used:', data.usage?.total_tokens);

    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    // AbortError = timeout
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    const message   = isTimeout
      ? 'Groq request timed out — the model took too long to respond. Please try again.'
      : (err?.message ?? 'Internal error in groq-analysis function');
    console.error('[groq-analysis] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
