/**
 * Speech-to-Text via AssemblyAI
 *
 * Architecture: client uploads audio to Supabase Storage → Edge Function
 * `assemblyai-transcribe` submits a signed URL to AssemblyAI → client polls
 * via Edge Function `assemblyai-poll`. The AssemblyAI key is stored only as
 * a Supabase secret and never touches the client bundle.
 *
 * Deploy secrets once:
 *   supabase secrets set ASSEMBLYAI_API_KEY=<your_key>
 *   supabase functions deploy assemblyai-transcribe
 *   supabase functions deploy assemblyai-poll
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const POLL_MAX_ATTEMPTS = 60; // 60 × 2 s = 120 s max

// Words to highlight as fillers even when AssemblyAI disfluency detection
// does not tag them (used as a secondary pass on the word list).
const FILLER_SET = new Set([
  'um', 'uh', 'hmm', 'mm', 'like', 'basically', 'literally',
  'actually', 'so', 'right', 'okay', 'well', 'mhm', 'uh-huh',
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

function log(label: string, ...args: any[]) {
  console.log(`[AssemblyAI/${label}]`, ...args);
}

function logError(label: string, ...args: any[]) {
  console.error(`[AssemblyAI/${label}]`, ...args);
}

// ─── Supabase Storage upload (web) ────────────────────────────────────────────

async function uploadToStorageWeb(uri: string, storagePath: string, mimeType: string): Promise<void> {
  log('upload-web', `Fetching blob from object URL, path=${storagePath}`);
  const res = await fetch(uri);
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

// ─── Edge Function proxy ───────────────────────────────────────────────────────

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

// ─── Public API ───────────────────────────────────────────────────────────────

export async function transcribeAudio(uri: string): Promise<TranscriptResult> {
  log('main', 'transcribeAudio called, uri type:',
    uri.startsWith('blob:') ? 'blob' : uri.startsWith('file:') ? 'file' : 'other');

  try {
    return await transcribeViaEdgeFunctions(uri);
  } catch (err: any) {
    logError('main', 'Edge Function path failed:', err?.message);
    return {
      text: '', words: [], filler_words: [], status: 'error',
      error: err?.message ?? 'Transcription failed — ensure Edge Functions are deployed.',
    };
  }
}
