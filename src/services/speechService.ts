/**
 * Speech-to-Text via AssemblyAI
 *
 * Architecture: client uploads audio to Supabase Storage → Edge Function
 * `assemblyai-transcribe` submits a signed URL to AssemblyAI → client polls
 * via Edge Function `assemblyai-poll`. This keeps the AssemblyAI key
 * server-side and out of the JS bundle.
 *
 * Falls back to direct AssemblyAI API calls if EXPO_PUBLIC_ASSEMBLYAI_KEY is
 * present and the Edge Functions have not yet been deployed.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const DIRECT_KEY  = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY ?? '';
const ASSEMBLYAI  = 'https://api.assemblyai.com/v2';
const UPLOAD_TIMEOUT_MS  = 60_000;
const POLL_MAX_ATTEMPTS  = 60;   // 60 × 2 s = 120 s max

// Words to highlight as fillers even when AssemblyAI disfluency detection
// does not tag them (used as a secondary pass on the word list).
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Log a labelled message to console — always visible in dev/prod. */
function log(label: string, ...args: any[]) {
  console.log(`[AssemblyAI/${label}]`, ...args);
}

function logError(label: string, ...args: any[]) {
  console.error(`[AssemblyAI/${label}]`, ...args);
}

// ─── Supabase Storage upload (web) ────────────────────────────────────────────

async function uploadToStorageWeb(uri: string, storagePath: string, mimeType: string): Promise<void> {
  log('upload-web', `Fetching blob from object URL, path=${storagePath}`);
  const res  = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to fetch local audio blob: HTTP ${res.status}`);
  const blob = await res.blob();
  log('upload-web', `Blob size: ${blob.size} bytes, type: ${blob.type}`);

  const { error } = await supabase.storage
    .from('speech-audio')
    .upload(storagePath, blob, { contentType: mimeType, upsert: true });

  if (error) {
    logError('upload-web', 'Supabase Storage upload failed:', error.message);
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  log('upload-web', 'Upload to Supabase Storage succeeded:', storagePath);
}

// ─── Supabase Storage upload (native) ─────────────────────────────────────────

async function uploadToStorageNative(uri: string, storagePath: string): Promise<void> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  log('upload-native', `Uploading ${uri} → storage/${storagePath}`);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseKey;

  const endpoint = `${supabaseUrl}/storage/v1/object/speech-audio/${storagePath}`;
  const response = await FileSystem.uploadAsync(endpoint, uri, {
    httpMethod:  'POST',
    headers:     { authorization: `Bearer ${token}`, 'content-type': 'audio/m4a', 'x-upsert': 'true' },
    uploadType:  FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  log('upload-native', `Storage response status: ${response.status}`);
  if (response.status !== 200) {
    logError('upload-native', 'Upload failed. Body:', response.body?.slice(0, 300));
    throw new Error(`Storage upload failed with status ${response.status}: ${response.body?.slice(0, 200)}`);
  }
}

// ─── Edge Function path ────────────────────────────────────────────────────────

async function transcribeViaEdgeFunctions(uri: string): Promise<TranscriptResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated — cannot use Edge Function proxy');

  const ext         = Platform.OS === 'web' ? 'webm' : 'm4a';
  const mimeType    = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
  const storagePath = `${user.id}/${Date.now()}.${ext}`;

  log('proxy', 'Uploading audio to Supabase Storage:', storagePath);

  if (Platform.OS === 'web') {
    await uploadToStorageWeb(uri, storagePath, mimeType);
  } else {
    await uploadToStorageNative(uri, storagePath);
  }

  log('proxy', 'Invoking assemblyai-transcribe edge function');

  const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
    'assemblyai-transcribe',
    { body: { storagePath } },
  );

  if (transcribeError) {
    logError('proxy', 'assemblyai-transcribe error:', transcribeError.message, transcribeError);
    throw new Error(`assemblyai-transcribe failed: ${transcribeError.message}`);
  }
  if (!transcribeData?.transcriptId) {
    logError('proxy', 'assemblyai-transcribe returned no transcriptId:', JSON.stringify(transcribeData));
    throw new Error('assemblyai-transcribe returned no transcriptId');
  }

  const transcriptId: string = transcribeData.transcriptId;
  log('proxy', 'Transcript ID received:', transcriptId);

  // Poll via Edge Function
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const { data: pollData, error: pollError } = await supabase.functions.invoke(
      'assemblyai-poll',
      { body: { transcriptId } },
    );

    if (pollError) {
      logError('proxy', `Poll #${i + 1} error:`, pollError.message);
      continue;
    }

    log('proxy', `Poll #${i + 1} status:`, pollData?.status);

    if (pollData?.status === 'completed') {
      const words: WordItem[] = pollData.words ?? [];
      // Tag as filler if AssemblyAI flagged it OR it's in our local set
      const filler_words = words.filter(w =>
        (w as any).filler === true || FILLER_SET.has(w.text.toLowerCase().trim())
      );
      log('proxy', `Transcription complete. Words: ${words.length}, Fillers: ${filler_words.length}`);
      return { text: pollData.text ?? '', words, filler_words, status: 'completed' };
    }

    if (pollData?.status === 'error') {
      logError('proxy', 'AssemblyAI reported error:', pollData.error);
      return { text: '', words: [], filler_words: [], status: 'error', error: pollData.error };
    }
  }

  logError('proxy', 'Polling timed out after 2 minutes');
  return { text: '', words: [], filler_words: [], status: 'error', error: 'Timeout after 2 minutes' };
}

// ─── Direct AssemblyAI path (fallback / development) ──────────────────────────

async function uploadAudioDirect(uri: string): Promise<string> {
  log('direct', 'uploadAudio — key present:', !!DIRECT_KEY, '| platform:', Platform.OS);

  if (!DIRECT_KEY) throw new Error('EXPO_PUBLIC_ASSEMBLYAI_KEY is not set in .env');

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    if (Platform.OS === 'web') {
      log('direct', 'Fetching web blob from:', uri.slice(0, 60));
      const res  = await fetch(uri);
      if (!res.ok) throw new Error(`Failed to read local audio: HTTP ${res.status}`);
      const blob = await res.blob();
      log('direct', `Blob size: ${blob.size} bytes`);

      const uploadRes = await fetch(`${ASSEMBLYAI}/upload`, {
        method:  'POST',
        headers: { authorization: DIRECT_KEY, 'content-type': 'application/octet-stream' },
        body:    blob,
        signal:  controller.signal,
      });

      if (!uploadRes.ok) {
        const body = await uploadRes.text().catch(() => '');
        logError('direct', `Upload HTTP ${uploadRes.status}:`, body.slice(0, 300));
        throw new Error(`AssemblyAI upload failed (${uploadRes.status}): ${body.slice(0, 200)}`);
      }

      const data = await uploadRes.json();
      if (!data.upload_url) throw new Error(`AssemblyAI upload returned no upload_url: ${JSON.stringify(data)}`);
      log('direct', 'Upload URL received');
      return data.upload_url;
    }

    // Native
    const response = await FileSystem.uploadAsync(`${ASSEMBLYAI}/upload`, uri, {
      httpMethod:  'POST',
      headers:     { authorization: DIRECT_KEY },
      uploadType:  FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    log('direct', `Native upload status: ${response.status}`);
    if (response.status < 200 || response.status >= 300) {
      logError('direct', 'Native upload failed:', response.body?.slice(0, 300));
      throw new Error(`AssemblyAI upload failed (${response.status}): ${response.body?.slice(0, 200)}`);
    }

    const data = JSON.parse(response.body);
    if (!data.upload_url) throw new Error(`No upload_url in response: ${response.body.slice(0, 200)}`);
    log('direct', 'Native upload URL received');
    return data.upload_url;

  } finally {
    clearTimeout(timeout);
  }
}

async function requestTranscriptionDirect(audioUrl: string): Promise<string> {
  log('direct', 'Submitting transcription request, audio_url length:', audioUrl.length);

  const res = await fetch(`${ASSEMBLYAI}/transcript`, {
    method:  'POST',
    headers: { authorization: DIRECT_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url:     audioUrl,
      language_code: 'en',
      // IMPORTANT: AssemblyAI's param is `disfluencies` (not `filler_words`).
      // When true, it preserves um/uh/hmm in the transcript instead of
      // silently removing them, and also tags the word items with filler=true.
      disfluencies: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logError('direct', `Transcription request failed (${res.status}):`, body.slice(0, 300));
    throw new Error(`AssemblyAI transcription request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  if (!json.id) {
    logError('direct', 'No transcript ID in response:', JSON.stringify(json));
    throw new Error(`AssemblyAI returned no transcript ID: ${JSON.stringify(json).slice(0, 200)}`);
  }

  log('direct', 'Transcript ID:', json.id);
  return json.id;
}

async function pollResultDirect(id: string): Promise<TranscriptResult> {
  log('direct', 'Starting polling loop for transcript:', id);

  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2000));

    let res: Response;
    try {
      res = await fetch(`${ASSEMBLYAI}/transcript/${id}`, {
        headers: { authorization: DIRECT_KEY },
      });
    } catch (fetchErr: any) {
      logError('direct', `Poll #${i + 1} network error:`, fetchErr.message);
      continue;
    }

    if (!res.ok) {
      logError('direct', `Poll #${i + 1} HTTP ${res.status}`);
      continue;
    }

    const data = await res.json();
    log('direct', `Poll #${i + 1} status:`, data.status);

    if (data.status === 'completed') {
      const words: WordItem[] = data.words ?? [];
      // Combine AssemblyAI's native filler tagging with our local FILLER_SET
      const filler_words = words.filter(w =>
        (w as any).filler === true || FILLER_SET.has(w.text.toLowerCase().trim())
      );
      log('direct', `Complete. Words: ${words.length}, Fillers: ${filler_words.length}, Text preview: "${data.text?.slice(0, 80)}"`);
      return { text: data.text ?? '', words, filler_words, status: 'completed' };
    }

    if (data.status === 'error') {
      logError('direct', 'AssemblyAI error on transcript:', data.error);
      return { text: '', words: [], filler_words: [], status: 'error', error: data.error };
    }
  }

  logError('direct', 'Polling timed out');
  return { text: '', words: [], filler_words: [], status: 'error', error: 'Timeout after 2 minutes' };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function transcribeAudio(uri: string): Promise<TranscriptResult> {
  log('main', 'transcribeAudio called, uri type:', uri.startsWith('blob:') ? 'blob' : uri.startsWith('file:') ? 'file' : 'other');

  // Attempt server-side proxy first (AssemblyAI key stays server-side)
  try {
    const result = await transcribeViaEdgeFunctions(uri);
    return result;
  } catch (proxyErr: any) {
    log('main', 'Proxy path failed, trying direct fallback:', proxyErr?.message);
  }

  // Direct fallback (uses EXPO_PUBLIC_ASSEMBLYAI_KEY from .env)
  if (!DIRECT_KEY) {
    logError('main', 'No API key available. Set EXPO_PUBLIC_ASSEMBLYAI_KEY or deploy Edge Functions.');
    return {
      text: '', words: [], filler_words: [], status: 'no_key',
      error: 'No AssemblyAI key — add EXPO_PUBLIC_ASSEMBLYAI_KEY to .env or deploy Edge Functions',
    };
  }

  log('main', 'Using direct API path with client-side key');
  try {
    const uploadUrl    = await uploadAudioDirect(uri);
    const transcriptId = await requestTranscriptionDirect(uploadUrl);
    return await pollResultDirect(transcriptId);
  } catch (err: any) {
    logError('main', 'Direct path fatal error:', err?.message);
    return { text: '', words: [], filler_words: [], status: 'error', error: err?.message ?? 'Transcription failed' };
  }
}
