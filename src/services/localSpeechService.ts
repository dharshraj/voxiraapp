/**
 * localSpeechService.ts
 * ─────────────────────
 * Calls the local Voxira ML server (whisper_server/main.py).
 *
 * Endpoint used: POST /analyze-speech
 *
 * What the server does (all local, no internet):
 *   1. Whisper base model  → transcript + word timings
 *   2. librosa             → 13 acoustic features
 *   3. Random Forest       → Good / Average / Poor + confidence %
 *
 * What this file does after getting the response:
 *   - Returns everything to AnalyzingScreen in one clean object
 *   - AnalyzingScreen merges it with the Groq API result
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// ── Config ────────────────────────────────────────────────────────────────────
const WHISPER_BASE_URL =
  (process.env.EXPO_PUBLIC_WHISPER_SERVER_URL ?? 'http://localhost:8000').replace(/\/$/, '');

const TIMEOUT_MS = 90_000; // 90s — feature extraction + transcription can be slow on CPU

// ── Public types ──────────────────────────────────────────────────────────────

export interface WordTiming {
  word:  string;
  start: number;
  end:   number;
}

export interface MLPrediction {
  label:          string;   // "Good" | "Average" | "Poor"
  label_index:    number;   // 2 | 1 | 0
  confidence:     number;   // 0.0 – 1.0
  probabilities:  Record<string, number>;
  model_accuracy: number;   // reported test accuracy of the trained RF model
}

export interface LocalSpeechResult {
  transcript:      string;
  words:           WordTiming[];
  audioDuration:   number;
  wpm:             number;
  paceScore:       number;
  fillerBreakdown: Record<string, number>;
  fillerCount:     number;
  language:        string | null;
  features:        Record<string, number>;   // raw ML features for faculty demo
  mlPrediction:    MLPrediction | null;      // Random Forest result
  mlAvailable:     boolean;
  status:          'ok' | 'server_down' | 'error';
  error?:          string;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function localTranscribe(
  audioUri:     string,
  durationSecs: number,
): Promise<LocalSpeechResult> {
  log('localTranscribe called', { uri: audioUri?.slice(0, 50), durationSecs });

  if (!audioUri) {
    return emptyResult('error', 'No audio URI provided');
  }

  let raw: AnalysisServerResponse;
  try {
    raw = await callServer(audioUri);
  } catch (err: any) {
    const msg = err?.message ?? 'Unknown error';
    const isDown = /Network request failed|ECONNREFUSED|Failed to fetch|connect/i.test(msg);
    logError('Server call failed', msg);
    return emptyResult(isDown ? 'server_down' : 'error', msg);
  }

  const transcript    = (raw.transcript ?? '').trim();
  const audioDuration = raw.duration > 0 ? raw.duration : durationSecs;
  const wpm           = raw.wpm ?? 0;
  const paceScore     = raw.pace_score ?? calcPaceScore(wpm);
  const fillerBreakdown: Record<string, number> = raw.filler_breakdown ?? {};
  const fillerCount   = raw.filler_count ?? Object.values(fillerBreakdown).reduce((a, b) => a + b, 0);
  const features      = raw.features ?? {};

  const mlPrediction: MLPrediction | null = raw.ml_prediction
    ? {
        label:         raw.ml_prediction.label,
        label_index:   raw.ml_prediction.label_index,
        confidence:    raw.ml_prediction.confidence,
        probabilities: raw.ml_prediction.probabilities,
        model_accuracy: raw.ml_prediction.model_accuracy,
      }
    : null;

  log('Result', {
    transcript: transcript.slice(0, 60),
    wpm, paceScore, fillerCount,
    ml: mlPrediction ? `${mlPrediction.label} (${(mlPrediction.confidence*100).toFixed(1)}%)` : 'n/a',
  });

  return {
    transcript,
    words:        raw.words ?? [],
    audioDuration,
    wpm,
    paceScore,
    fillerBreakdown,
    fillerCount,
    language:     raw.language ?? null,
    features,
    mlPrediction,
    mlAvailable:  raw.ml_available ?? false,
    status:       'ok',
  };
}

// ── Server communication ──────────────────────────────────────────────────────

interface AnalysisServerResponse {
  transcript:       string;
  words:            WordTiming[];
  duration:         number;
  language?:        string | null;
  wpm:              number;
  filler_count:     number;
  filler_rate:      number;
  pace_score:       number;
  filler_breakdown: Record<string, number>;
  ml_prediction?:   MLPrediction | null;
  ml_available?:    boolean;
  features:         Record<string, number>;
}

async function callServer(audioUri: string): Promise<AnalysisServerResponse> {
  const url = `${WHISPER_BASE_URL}/analyze-speech`;
  log('POST', url);

  if (Platform.OS === 'web') {
    return callServerWeb(audioUri, url);
  }
  return callServerNative(audioUri, url);
}

async function callServerWeb(uri: string, url: string): Promise<AnalysisServerResponse> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const blobRes = await fetch(uri);
    if (!blobRes.ok) throw new Error(`Cannot read audio blob: HTTP ${blobRes.status}`);
    const blob = await blobRes.blob();
    const form = new FormData();
    const ext  = uri.startsWith('blob:') ? 'webm' : 'm4a';
    form.append('audio', blob, `recording.${ext}`);

    const res = await fetch(url, { method: 'POST', body: form, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Server HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callServerNative(uri: string, url: string): Promise<AnalysisServerResponse> {
  const res = await FileSystem.uploadAsync(url, uri, {
    httpMethod:  'POST',
    uploadType:  FileSystem.FileSystemUploadType.MULTIPART,
    fieldName:   'audio',
    mimeType:    'audio/m4a',
  });
  if (res.status !== 200) {
    throw new Error(`Server HTTP ${res.status}: ${res.body?.slice(0, 200)}`);
  }
  try {
    return JSON.parse(res.body) as AnalysisServerResponse;
  } catch {
    throw new Error('Server response was not valid JSON');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcPaceScore(wpm: number): number {
  if (wpm === 0) return 60;
  return Math.round(Math.max(40, Math.min(100, 100 - Math.abs(wpm - 130) / 1.5)));
}

function emptyResult(status: 'server_down' | 'error', error: string): LocalSpeechResult {
  return {
    transcript: '', words: [], audioDuration: 0, wpm: 0, paceScore: 60,
    fillerBreakdown: {}, fillerCount: 0, language: null,
    features: {}, mlPrediction: null, mlAvailable: false,
    status, error,
  };
}

function log(label: string, ...args: any[]) {
  console.log(`[LocalSpeech] ${label}`, ...args);
}
function logError(label: string, ...args: any[]) {
  console.error(`[LocalSpeech] ${label}`, ...args);
}
