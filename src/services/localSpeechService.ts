/**
 * localSpeechService.ts
 * ─────────────────────
 * Calls the local Voxira ML server (whisper_server/main.py).
 *
 * Endpoint used: POST /analyze-speech
 *
 * What the server does (all local, no internet):
 *   1. faster-whisper small model  → transcript + word timings
 *   2. librosa (yin)               → 13 acoustic features
 *   3. Random Forest               → Good / Average / Poor + confidence %
 *
 * Mobile / production behaviour:
 *   - The local server is only reachable from the same LAN (your PC).
 *   - On native mobile builds, we skip the local server entirely and
 *     return server_down immediately so AnalyzingScreen falls back to
 *     AssemblyAI without wasting time on a connection that will fail.
 *   - On web, a quick health-check (3 s timeout) is done first; if the
 *     server does not respond the full request is skipped too.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

// ── Config ────────────────────────────────────────────────────────────────────
const WHISPER_BASE_URL =
  (process.env.EXPO_PUBLIC_WHISPER_SERVER_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// Whether we have a real server URL configured (not just localhost / LAN)
const IS_LOCALHOST_URL = /localhost|127\.0\.0\.1|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|10\./
  .test(WHISPER_BASE_URL);

const TIMEOUT_MS        = 30_000; // 30 s — faster-whisper small on CPU is ~3–8 s
const HEALTH_TIMEOUT_MS = 3_000;  // 3 s health-check before committing to full upload

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
  log('localTranscribe called', { uri: audioUri?.slice(0, 50), durationSecs, platform: Platform.OS });

  if (!audioUri) {
    return emptyResult('error', 'No audio URI provided');
  }

  // ── Native mobile: skip local server only in production (Vercel deploy) ──
  // When running via Expo Go on the same LAN as the server, it IS reachable.
  // We only skip if it's a localhost/LAN URL AND we're in a production build
  // (no __DEV__ means bundled for production, not Expo Go dev server).
  if (Platform.OS !== 'web' && IS_LOCALHOST_URL && !__DEV__) {
    log('Skipping local server on native production build — LAN URL not reachable');
    return emptyResult('server_down', 'Local server not reachable in production');
  }

  // ── Web: quick health-check before uploading audio ────────────────────────
  if (Platform.OS === 'web') {
    const alive = await isServerAlive();
    if (!alive) {
      log('Health check failed — server unreachable');
      return emptyResult('server_down', 'Local analysis server is not running');
    }
  }

  let raw: AnalysisServerResponse;
  try {
    raw = await callServer(audioUri);
  } catch (err: any) {
    const msg = err?.message ?? 'Unknown error';
    const isDown = /Network request failed|ECONNREFUSED|Failed to fetch|connect|abort/i.test(msg);
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

/** Quick GET /health with a short timeout — used to avoid uploading audio to a dead server. */
async function isServerAlive(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const res = await fetch(`${WHISPER_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
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
  // FileSystem.uploadAsync has no built-in timeout — wrap with a race so we
  // don't hang forever if the server is unreachable on the local network.
  const uploadPromise = FileSystem.uploadAsync(url, uri, {
    httpMethod:  'POST',
    uploadType:  FileSystem.FileSystemUploadType.MULTIPART,
    fieldName:   'audio',
    mimeType:    'audio/m4a',
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
  );

  const res = await Promise.race([uploadPromise, timeoutPromise]);

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
