/**
 * Supabase Edge Function: openai-proxy
 *
 * Proxies chat completion requests to OpenAI using a server-side API key.
 * Requires the caller to be authenticated (sends Authorization header automatically
 * when called via supabase.functions.invoke from an authenticated session).
 *
 * Secrets required:
 *   supabase secrets set OPENAI_KEY=sk-...
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_KEY  = Deno.env.get('OPENAI_KEY') ?? '';
const OPENAI_BASE = 'https://api.openai.com/v1';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!OPENAI_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_KEY secret not configured on the server' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const {
      messages,
      model       = 'gpt-4o-mini',
      max_tokens  = 900,
      temperature = 0.6,
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens }),
      signal: AbortSignal.timeout(28_000), // leave headroom under Edge Function timeout
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `OpenAI error ${upstream.status}`, details: data }), {
        status: upstream.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[openai-proxy] Error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
