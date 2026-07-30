/**
 * Supabase Edge Function: assemblyai-poll
 *
 * Given a transcriptId, fetches the current status from AssemblyAI and
 * returns it to the client. The client calls this repeatedly (every ~2 s)
 * until status is 'completed' or 'error'.
 *
 * Secrets required:
 *   supabase secrets set ASSEMBLYAI_KEY=...
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ASSEMBLYAI_KEY  = Deno.env.get('ASSEMBLYAI_KEY') ?? '';
const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!ASSEMBLYAI_KEY) {
      return new Response(JSON.stringify({ error: 'ASSEMBLYAI_KEY secret not configured' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { transcriptId } = await req.json();
    if (!transcriptId) {
      return new Response(JSON.stringify({ error: 'transcriptId is required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const res  = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
      headers: { authorization: ASSEMBLYAI_KEY },
    });

    if (!res.ok) {
      throw new Error(`AssemblyAI poll failed with status ${res.status}`);
    }

    const data = await res.json();

    // Return only what the client needs to keep payload small
    return new Response(JSON.stringify({
      status: data.status,
      text:   data.text   ?? '',
      words:  data.words  ?? [],
      error:  data.error  ?? null,
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[assemblyai-poll] Error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
