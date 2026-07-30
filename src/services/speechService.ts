/**
 * Speech-to-Text via Groq Whisper
 *
 * Architecture: client uploads audio to Supabase Storage → Edge Function
 * `groq-transcribe` downloads it and submits it to Groq's Whisper endpoint
 * in a single synchronous call. No polling needed.
 *
 * The GROQ_API_KEY is kept server-side in Supabase secrets and never bundled
 * into the client.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const UPLOAD_TIMEOUT_MS = 60_000;

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
  console.log(`[groq-transcribe/${label}]`, ...args);
}

function logError(label: string, ...args: any[]) {
  console.error(`[groq-transcribe/${label}]`, ...args);
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

// ─── Main transcription path ──────────────────────────────────────────────────

async function transcribeViaGroq(uri: string): Promise<TranscriptResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated — cannot use Edge Function proxy');

  const ext         = Platform.OS === 'web' ? 'webm' : 'm4a';
  const mimeType    = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
  const storagePath = `${user.id}/${Date.now()}.${ext}`;

  log('main', 'Uploading audio to Supabase Storage:', storagePath);

  if (Platform.OS === 'web') {
    await uploadToStorageWeb(uri, storagePath, mimeType);
  } else {
    await uploadToStorageNative(uri, storagePath);
  }

  log('main', 'Invoking groq-transcribe edge function');

  const { data, error } = await supabase.functions.invoke('groq-transcribe', {
    body: { storagePath },
  });

  if (error) {
    logError('main', 'groq-transcribe error:', error.message, error);
    throw new Error(`groq-transcribe failed: ${error.message}`);
  }

  if (data?.error) {
    logError('main', 'groq-transcribe returned error:', data.error);
    throw new Error(data.error);
  }

  const text: string = data?.text ?? '';
  log('main', 'Transcription complete. Preview:', text.slice(0, 100));

  // Groq Whisper does not return word-level timestamps in the basic JSON format.
  // Filler word analysis is handled by the groq-analysis LLM step that follows.
  return {
    text,
    words:        [],
    filler_words: [],
    status: 'completed',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function transcribeAudio(uri: string): Promise<TranscriptResult> {
  log('main', 'transcribeAudio called, uri type:',
    uri.startsWith('blob:') ? 'blob' : uri.startsWith('file:') ? 'file' : 'other');

  try {
    return await transcribeViaGroq(uri);
  } catch (err: any) {
    logError('main', 'Transcription failed:', err?.message);
    return {
      text:         '',
      words:        [],
      filler_words: [],
      status:       'error',
      error:        err?.message ?? 'Transcription failed',
    };
  }
}
