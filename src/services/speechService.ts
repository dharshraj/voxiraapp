/**
 * Speech-to-Text via AssemblyAI
 * Add EXPO_PUBLIC_ASSEMBLYAI_KEY to .env
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY ?? '';
const BASE = 'https://api.assemblyai.com/v2';

const FILLER_SET = new Set([
  'um', 'uh', 'hmm', 'mm', 'like', 'basically', 'literally',
  'actually', 'so', 'right', 'okay', 'well', 'mhm', 'uh-huh',
]);

export interface WordItem {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptResult {
  text: string;
  words: WordItem[];
  filler_words: WordItem[];
  status: 'completed' | 'error' | 'no_key';
  error?: string;
}

async function uploadAudio(uri: string): Promise<string> {
  console.log('[AssemblyAI] uploadAudio — API key present:', !!API_KEY);
  console.log('[AssemblyAI] uploadAudio — URI:', uri.slice(0, 80));

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const uploadRes = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: { authorization: API_KEY, 'content-type': 'application/octet-stream' },
      body: blob,
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
    const data = await uploadRes.json();
    console.log('[AssemblyAI] Upload URL:', data.upload_url?.slice(0, 80));
    return data.upload_url;
  }

  // Native: FileSystem.uploadAsync handles file:// URIs correctly.
  // atob() is not available in the React Native JS runtime.
  const response = await FileSystem.uploadAsync(`${BASE}/upload`, uri, {
    httpMethod: 'POST',
    headers: { 'authorization': API_KEY },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  console.log('[AssemblyAI] Upload response status:', response.status);
  const data = JSON.parse(response.body);
  if (!data.upload_url) throw new Error(`No upload_url in response: ${response.body.slice(0, 200)}`);
  console.log('[AssemblyAI] Upload URL:', data.upload_url?.slice(0, 80));
  return data.upload_url;
}

async function requestTranscription(audioUrl: string): Promise<string> {
  console.log('[AssemblyAI] requestTranscription — audio URL:', audioUrl.slice(0, 80));
  const res = await fetch(`${BASE}/transcript`, {
    method: 'POST',
    headers: { authorization: API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: 'en',
      filler_words: true,
    }),
  });
  if (!res.ok) throw new Error(`Transcription request failed: ${res.status}`);
  const { id } = await res.json();
  console.log('[AssemblyAI] Transcript ID:', id);
  return id;
}

async function pollResult(id: string): Promise<TranscriptResult> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/transcript/${id}`, {
      headers: { authorization: API_KEY },
    });
    const data = await res.json();
    console.log(`[AssemblyAI] Poll #${i + 1} status:`, data.status);

    if (data.status === 'completed') {
      const words: WordItem[] = data.words ?? [];
      const filler_words = words.filter(w => FILLER_SET.has(w.text.toLowerCase().trim()));
      console.log('[AssemblyAI] Transcript chars:', data.text?.length ?? 0);
      console.log('[AssemblyAI] Final text (first 100):', data.text?.substring(0, 100));
      console.log('[AssemblyAI] Filler words found:', filler_words.length);
      return { text: data.text ?? '', words, filler_words, status: 'completed' };
    }
    if (data.status === 'error') {
      console.log('[AssemblyAI] Transcription error:', data.error);
      return { text: '', words: [], filler_words: [], status: 'error', error: data.error };
    }
  }
  return { text: '', words: [], filler_words: [], status: 'error', error: 'Timeout after 2 minutes' };
}

export async function transcribeAudio(uri: string): Promise<TranscriptResult> {
  if (!API_KEY) {
    console.warn('[AssemblyAI] No API key — set EXPO_PUBLIC_ASSEMBLYAI_KEY in .env');
    return { text: '', words: [], filler_words: [], status: 'no_key', error: 'No API key set' };
  }
  try {
    const uploadUrl = await uploadAudio(uri);
    const transcriptId = await requestTranscription(uploadUrl);
    return await pollResult(transcriptId);
  } catch (err: any) {
    console.error('[AssemblyAI] Fatal error:', err?.message);
    return { text: '', words: [], filler_words: [], status: 'error', error: err?.message ?? 'Failed' };
  }
}
