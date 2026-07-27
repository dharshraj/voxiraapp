/**
 * Speech-to-Text via AssemblyAI
 *
 * Architecture: client uploads audio to Supabase Storage → Edge Function
 * `assemblyai-transcribe` submits a signed URL to AssemblyAI → client polls
 * via Edge Function `assemblyai-poll`. This keeps the AssemblyAI key
 * server-side and out of the JS bundle.
 *
 * Deployment steps (run once):
 *   supabase functions deploy assemblyai-transcribe assemblyai-poll
 *   supabase secrets set ASSEMBLYAI_KEY=...
 *   # Create bucket: Supabase Dashboard → Storage → New bucket "speech-audio" (private)
 *   # Add RLS: users can INSERT/SELECT objects whose path starts with their uid
 *   # Then remove EXPO_PUBLIC_ASSEMBLYAI_KEY from .env
 *
 * Falls back to direct AssemblyAI API calls if EXPO_PUBLIC_ASSEMBLYAI_KEY is
 * present and the Edge Functions have not yet been deployed.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

const DIRECT_KEY  = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY ?? '';
const ASSEMBLYAI  = 'https://api.assemblyai.com/v2';
const UPLOAD_TIMEOUT_MS = 60_000;
const POLL_MAX_ATTEMPTS  = 60;   // 60 × 2 s = 120 s max

const FILLER_SET = new Set([
  'um','uh','hmm','mm','like','basically','literally',
  'actually','so','right','okay','well','mhm','uh-huh',
]);

export interface WordItem {
  text:       string;
  start:      number;
  end:        number;
  confidence: number;
}

export interface TranscriptResult {
  text:         string;
  words:        WordItem[];
  filler_words: WordItem[];
  status:       'completed' | 'error' | 'no_key';
  error?:       string;
}

// ─── Supabase Storage upload (web) ────────────────────────────────────────────

async function uploadToStorageWeb(uri: string, storagePath: string, mimeType: string): Promise<void> {
  const res  = await fetch(uri);
  const blob = await res.blob();
  const { error } = await supabase.storage
    .from('speech-audio')
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

// ─── Supabase Storage upload (native) ─────────────────────────────────────────
// Uses FileSystem.uploadAsync to POST binary directly to the Storage REST API.

async function uploadToStorageNative(uri: string, storagePath: string): Promise<void> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  // Prefer the live session JWT so RLS is evaluated against the authenticated user
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseKey;

  const endpoint = `${supabaseUrl}/storage/v1/object/speech-audio/${storagePath}`;
  const response = await FileSystem.uploadAsync(endpoint, uri, {
    httpMethod:  'POST',
    headers:     { authorization: `Bearer ${token}`, 'content-type': 'audio/m4a', 'x-upsert': 'true' },
    uploadType:  FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (response.status !== 200) {
    throw new Error(`Storage upload failed with status ${response.status}`);
  }
}

// ─── Edge Function path ────────────────────────────────────────────────────────

async function transcribeViaEdgeFunctions(uri: string): Promise<TranscriptResult> {
  // Determine storage path
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext         = Platform.OS === 'web' ? 'webm' : 'm4a';
  const mimeType    = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
  const storagePath = `${user.id}/${Date.now()}.${ext}`;

  console.log('[AssemblyAI/proxy] Uploading to Supabase Storage:', storagePath);

  // Upload audio to Supabase Storage
  if (Platform.OS === 'web') {
    await uploadToStorageWeb(uri, storagePath, mimeType);
  } else {
    await uploadToStorageNative(uri, storagePath);
  }

  console.log('[AssemblyAI/proxy] Calling assemblyai-transcribe edge function');

  // Request transcription via Edge Function
  const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
    'assemblyai-transcribe',
    { body: { storagePath } },
  );
  if (transcribeError || !transcribeData?.transcriptId) {
    throw new Error(transcribeError?.message ?? 'assemblyai-transcribe returned no transcriptId');
  }

  const transcriptId: string = transcribeData.transcriptId;
  console.log('[AssemblyAI/proxy] Transcript ID:', transcriptId);

  // Poll via Edge Function
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const { data: pollData, error: pollError } = await supabase.functions.invoke(
      'assemblyai-poll',
      { body: { transcriptId } },
    );
    if (pollError) {
      console.warn('[AssemblyAI/proxy] Poll error:', pollError.message);
      continue;
    }

    console.log(`[AssemblyAI/proxy] Poll #${i + 1} status:`, pollData?.status);

    if (pollData?.status === 'completed') {
      const words: WordItem[] = pollData.words ?? [];
      const filler_words      = words.filter(w => FILLER_SET.has(w.text.toLowerCase().trim()));
      return { text: pollData.text ?? '', words, filler_words, status: 'completed' };
    }
    if (pollData?.status === 'error') {
      return { text: '', words: [], filler_words: [], status: 'error', error: pollData.error };
    }
  }

  return { text: '', words: [], filler_words: [], status: 'error', error: 'Timeout after 2 minutes' };
}

// ─── Direct AssemblyAI path (fallback) ────────────────────────────────────────

async function uploadAudioDirect(uri: string): Promise<string> {
  console.log('[AssemblyAI/direct] uploadAudio — key present:', !!DIRECT_KEY);

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    if (Platform.OS === 'web') {
      const res  = await fetch(uri);
      const blob = await res.blob();
      const uploadRes = await fetch(`${ASSEMBLYAI}/upload`, {
        method:  'POST',
        headers: { authorization: DIRECT_KEY, 'content-type': 'application/octet-stream' },
        body:    blob,
        signal:  controller.signal,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
      const data = await uploadRes.json();
      return data.upload_url;
    }

    // Native: FileSystem.uploadAsync handles file:// URIs correctly
    const response = await FileSystem.uploadAsync(`${ASSEMBLYAI}/upload`, uri, {
      httpMethod:  'POST',
      headers:     { authorization: DIRECT_KEY },
      uploadType:  FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });
    const data = JSON.parse(response.body);
    if (!data.upload_url) throw new Error(`No upload_url: ${response.body.slice(0, 200)}`);
    return data.upload_url;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestTranscriptionDirect(audioUrl: string): Promise<string> {
  const res = await fetch(`${ASSEMBLYAI}/transcript`, {
    method:  'POST',
    headers: { authorization: DIRECT_KEY, 'content-type': 'application/json' },
    body:    JSON.stringify({ audio_url: audioUrl, language_code: 'en', filler_words: true }),
  });
  if (!res.ok) throw new Error(`Transcription request failed: ${res.status}`);
  const { id } = await res.json();
  return id;
}

async function pollResultDirect(id: string): Promise<TranscriptResult> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res  = await fetch(`${ASSEMBLYAI}/transcript/${id}`, {
      headers: { authorization: DIRECT_KEY },
    });
    const data = await res.json();
    console.log(`[AssemblyAI/direct] Poll #${i + 1} status:`, data.status);

    if (data.status === 'completed') {
      const words: WordItem[] = data.words ?? [];
      const filler_words      = words.filter(w => FILLER_SET.has(w.text.toLowerCase().trim()));
      return { text: data.text ?? '', words, filler_words, status: 'completed' };
    }
    if (data.status === 'error') {
      return { text: '', words: [], filler_words: [], status: 'error', error: data.error };
    }
  }
  return { text: '', words: [], filler_words: [], status: 'error', error: 'Timeout after 2 minutes' };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function transcribeAudio(uri: string): Promise<TranscriptResult> {
  // Try Edge Function proxy first (no client-side API key needed)
  try {
    const result = await transcribeViaEdgeFunctions(uri);
    return result;
  } catch (proxyErr: any) {
    console.warn('[AssemblyAI] Proxy path failed, trying direct fallback:', proxyErr?.message);

    // Fall back to direct API call if key is available
    if (!DIRECT_KEY) {
      console.warn('[AssemblyAI] No direct API key — set EXPO_PUBLIC_ASSEMBLYAI_KEY or deploy Edge Functions');
      return { text: '', words: [], filler_words: [], status: 'no_key', error: 'No API key set' };
    }
  }

  // Direct fallback path
  try {
    const uploadUrl   = await uploadAudioDirect(uri);
    const transcriptId = await requestTranscriptionDirect(uploadUrl);
    return await pollResultDirect(transcriptId);
  } catch (err: any) {
    console.error('[AssemblyAI/direct] Fatal error:', err?.message);
    return { text: '', words: [], filler_words: [], status: 'error', error: err?.message ?? 'Failed' };
  }
}
