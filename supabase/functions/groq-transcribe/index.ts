/**
 * Supabase Edge Function: groq-transcribe
 *
 * Accepts a Supabase Storage path for an audio file, fetches it using the
 * service-role key, then submits it to Groq's Whisper endpoint for
 * speech-to-text transcription. Returns the transcript text in one call —
 * no polling required.
 *
 * Model: whisper-large-v3-turbo (fast, free tier available on Groq)
 * Endpoint: https://api.groq.com/openai/v1/audio/transcriptions
 *
 * Secrets required (run once):
 *   supabase secrets set GROQ_API_KEY=gsk_...
 *
 * Deploy:
 *   supabase functions deploy groq-transcribe
 *
 * Request body:
 *   { storagePath: string }   — path inside the speech-audio bucket
 *
 * Response:
 *   { text: string }          — raw transcript text
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_KEY    = Deno.env.get('GROQ_API_KEY')            ?? '';
const GROQ_BASE   = 'https://api.groq.com/openai/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')           ?? '';
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const WHISPER_MODEL = 'whisper-large-v3-turbo';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!GROQ_KEY) {
      console.error('[groq-transcribe] GROQ_API_KEY secret is not configured');
      return new Response(JSON.stringify({
        error: 'GROQ_API_KEY is not configured on the server. Run: supabase secrets set GROQ_API_KEY=gsk_...',
      }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    const { storagePath } = await req.json();
    if (!storagePath) {
      return new Response(JSON.stringify({ error: 'storagePath is required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[groq-transcribe] Fetching audio from storage:', storagePath);

    // ── Download audio from Supabase Storage (service-role bypasses RLS) ───
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from('speech-audio')
      .download(storagePath);

    if (downloadError || !fileData) {
      const msg = downloadError?.message ?? 'Storage download returned no data';
      console.error('[groq-transcribe] Storage download error:', msg);
      return new Response(JSON.stringify({ error: `Failed to download audio: ${msg}` }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[groq-transcribe] Audio downloaded, size:', fileData.size, 'bytes');

    // ── Determine file extension from path for MIME / filename ─────────────
    const ext      = storagePath.split('.').pop() ?? 'm4a';
    const mimeType = ext === 'webm' ? 'audio/webm' : ext === 'mp4' ? 'audio/mp4' : 'audio/m4a';
    const filename = `audio.${ext}`;

    // ── Submit to Groq Whisper ──────────────────────────────────────────────
    const formData = new FormData();
    formData.append('file', new File([fileData], filename, { type: mimeType }));
    formData.append('model', WHISPER_MODEL);
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    console.log('[groq-transcribe] Submitting to Groq Whisper, model:', WHISPER_MODEL);

    const groqRes = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body:    formData,
      signal:  AbortSignal.timeout(60_000),
    });

    const responseText = await groqRes.text();

    if (!groqRes.ok) {
      console.error('[groq-transcribe] Groq error', groqRes.status, responseText.slice(0, 300));
      return new Response(JSON.stringify({
        error: `Groq Whisper error (${groqRes.status}): ${responseText.slice(0, 200)}`,
      }), { status: groqRes.status, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('[groq-transcribe] Failed to parse Groq response:', responseText.slice(0, 200));
      return new Response(JSON.stringify({ error: 'Groq returned an unparseable response' }), {
        status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const text = parsed.text ?? '';
    console.log('[groq-transcribe] Transcription complete. Preview:', text.slice(0, 100));

    // ── Clean up storage file (fire-and-forget, don't block response) ───────
    adminClient.storage.from('speech-audio').remove([storagePath]).catch((e: any) =>
      console.warn('[groq-transcribe] Storage cleanup failed (non-fatal):', e?.message)
    );

    return new Response(JSON.stringify({ text }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
    const message   = isTimeout
      ? 'Groq Whisper timed out — please try a shorter recording.'
      : (err?.message ?? 'Internal error in groq-transcribe function');
    console.error('[groq-transcribe] Unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
