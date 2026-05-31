/**
 * Speech-to-Text via AssemblyAI
 * Add EXPO_PUBLIC_ASSEMBLYAI_KEY to your .env
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_KEY ?? '';
const BASE = 'https://api.assemblyai.com/v2';

// Single-word fillers that AssemblyAI will include when filler_words:true is set
const FILLER_SET = new Set([
  'um', 'uh', 'hmm', 'mm', 'like', 'basically', 'literally',
  'actually', 'so', 'right', 'okay', 'well', 'mhm', 'uh-huh',
]);

export interface WordItem {
  text: string;
  start: number;       // milliseconds from audio start
  end: number;
  confidence: number;  // 0–1
}

export interface TranscriptResult {
  text: string;
  words: WordItem[];
  filler_words: WordItem[];  // subset of words that are fillers
  status: 'completed' | 'error' | 'no_key';
  error?: string;
}

async function uploadAudio(uri: string): Promise<string> {
  let body: any;

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    body = await res.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    body = bytes.buffer;
  }

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: {
      'authorization': API_KEY,
      'content-type': 'application/octet-stream',
    },
    body,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return data.upload_url;
}

async function requestTranscription(audioUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/transcript`, {
    method: 'POST',
    headers: { 'authorization': API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: 'en',
      filler_words: true,   // include um, uh, hmm etc. in transcript + words array
    }),
  });
  if (!res.ok) throw new Error(`Transcription request failed: ${res.status}`);
  const { id } = await res.json();
  return id;
}

async function pollResult(id: string): Promise<TranscriptResult> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/transcript/${id}`, {
      headers: { 'authorization': API_KEY },
    });
    const data = await res.json();

    if (data.status === 'completed') {
      const words: WordItem[] = data.words ?? [];
      const filler_words = words.filter(w => FILLER_SET.has(w.text.toLowerCase().trim()));
      return { text: data.text ?? '', words, filler_words, status: 'completed' };
    }
    if (data.status === 'error') {
      return { text: '', words: [], filler_words: [], status: 'error', error: data.error };
    }
  }
  return { text: '', words: [], filler_words: [], status: 'error', error: 'Timeout' };
}

export async function transcribeAudio(uri: string): Promise<TranscriptResult> {
  if (!API_KEY) {
    return { text: '', words: [], filler_words: [], status: 'no_key', error: 'No API key set' };
  }
  try {
    const uploadUrl = await uploadAudio(uri);
    const transcriptId = await requestTranscription(uploadUrl);
    return await pollResult(transcriptId);
  } catch (err: any) {
    return { text: '', words: [], filler_words: [], status: 'error', error: err?.message ?? 'Failed' };
  }
}
