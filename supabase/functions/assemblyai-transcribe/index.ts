/**
 * Supabase Edge Function: assemblyai-transcribe
 *
 * Accepts a Supabase Storage path for an audio file, generates a short-lived
 * signed URL, then submits it to AssemblyAI for transcription.
 * Returns { transcriptId } which the client uses to poll assemblyai-poll.
 *
 * Secrets required:
 *   supabase secrets set ASSEMBLYAI_KEY=...
 *
 * Storage setup (run in Supabase SQL editor):
 *   INSERT INTO storage.buckets (id, name, public) VALUES ('speech-audio', 'speech-audio', false);
 *   CREATE POLICY "Users upload own audio" ON storage.objects
 *     FOR INSERT WITH CHECK (bucket_id = 'speech-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
 *   CREATE POLICY "Users read own audio" ON storage.objects
 *     FOR SELECT USING (bucket_id = 'speech-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ASSEMBLYAI_KEY  = Deno.env.get('ASSEMBLYAI_KEY') ?? '';
const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')              ?? '';
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!ASSEMBLYAI_KEY) {
      console.error('[assemblyai-transcribe] ASSEMBLYAI_KEY secret is not set');
      return new Response(JSON.stringify({ error: 'ASSEMBLYAI_KEY secret not configured on the server' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { storagePath } = await req.json();
    if (!storagePath) {
      return new Response(JSON.stringify({ error: 'storagePath is required' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[assemblyai-transcribe] Creating signed URL for:', storagePath);

    // Use service role client to create a signed URL (bypasses RLS)
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: signedData, error: signedError } = await adminClient.storage
      .from('speech-audio')
      .createSignedUrl(storagePath, 3600); // 1-hour expiry

    if (signedError || !signedData?.signedUrl) {
      const msg = signedError?.message ?? 'createSignedUrl returned no URL';
      console.error('[assemblyai-transcribe] Signed URL error:', msg);
      throw new Error(`Failed to create signed URL: ${msg}`);
    }

    console.log('[assemblyai-transcribe] Submitting to AssemblyAI');

    // Submit to AssemblyAI
    // NOTE: The correct param is `disfluencies` (not `filler_words`).
    //       When true, AssemblyAI preserves um/uh/hmm in the transcript text
    //       and sets filler=true on the matching word items.
    const res = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method:  'POST',
      headers: {
        authorization:  ASSEMBLYAI_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url:     signedData.signedUrl,
        language_code: 'en',
        disfluencies:  true,   // ← correct param name (was incorrectly `filler_words`)
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[assemblyai-transcribe] AssemblyAI error', res.status, body.slice(0, 300));
      throw new Error(`AssemblyAI transcript request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    if (!json.id) {
      console.error('[assemblyai-transcribe] No transcript ID in response:', JSON.stringify(json));
      throw new Error(`AssemblyAI returned no transcript ID: ${JSON.stringify(json).slice(0, 200)}`);
    }

    console.log('[assemblyai-transcribe] Transcript ID:', json.id);

    return new Response(JSON.stringify({ transcriptId: json.id }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[assemblyai-transcribe] Unhandled error:', err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
