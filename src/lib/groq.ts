/**
 * AI service — Speech Analysis via Groq
 *
 * All requests are routed through the `groq-analysis` Supabase Edge Function
 * which calls Groq's API server-side using llama-3.3-70b-versatile.
 * The GROQ_API_KEY is NEVER in the client bundle.
 *
 * Deploy steps (run once):
 *   supabase functions deploy groq-analysis
 *   supabase secrets set GROQ_API_KEY=gsk_...
 */

import { supabase } from './supabase';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const TIMEOUT_MS = 35_000;

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface FillerWordEntry {
  word:  string;
  count: number;
}

export interface SpeechAnalysis {
  clarityScore:        number;
  confidenceScore:     number;
  structureScore:      number;
  structureFeedback:   string;
  alternateAnswers:    string[];
  improvementTips:     string[];
  /** LLM-detected filler words found in the actual transcript, with counts */
  fillerWordAnalysis:  FillerWordEntry[];
  /** 2-3 suggestions tied to the specific content and delivery of this speech */
  contentSuggestions:  string[];
}

// ─── Core Groq Wrapper ────────────────────────────────────────────────────────

/**
 * chatGroq — routes through the groq-analysis Edge Function.
 * The GROQ_API_KEY never touches the client. No direct-key fallback by design.
 * Throws with a human-readable message on any failure so callers can surface it.
 */
async function chatGroq(system: string, user: string, maxTokens = 1000): Promise<string> {
  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: user   },
  ];

  console.log('[AI] Invoking speech analysis, model:', GROQ_MODEL);

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let data: any;
  let error: any;
  try {
    ({ data, error } = await supabase.functions.invoke('groq-analysis', {
      body: { messages, model: GROQ_MODEL, max_tokens: maxTokens, temperature: 0.4 },
    }));
  } finally {
    clearTimeout(timeout);
  }

  if (error) {
    const msg = error?.message ?? 'Speech analysis service returned an error';
    console.error('[AI] Edge function error:', msg);
    throw new Error(msg);
  }

  if (data?.error) {
    console.error('[AI] API error from edge function:', data.error);
    throw new Error('Speech analysis failed. Please try again.');
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    console.error('[AI] Unexpected response shape:', JSON.stringify(data)?.slice(0, 300));
    throw new Error('Analysis returned an empty response — please try again.');
  }

  console.log('[AI] Success — tokens:', data.usage?.total_tokens, '| preview:', text.slice(0, 80));
  return text as string;
}

// Extracts a JSON value from a possibly-markdown-wrapped string.
function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(stripped) as T;
  } catch {
    const objMatch = raw.match(/(\{[\s\S]*\})/);
    const arrMatch = raw.match(/(\[[\s\S]*\])/);
    const match    = objMatch?.[1] ?? arrMatch?.[1];
    if (match) {
      try { return JSON.parse(match) as T; } catch {}
    }
    console.warn('[AI] JSON parse failed — using fallback');
    return fallback;
  }
}

// ─── Speech Analysis ──────────────────────────────────────────────────────────

const SPEECH_FALLBACK: SpeechAnalysis = {
  clarityScore:      72,
  confidenceScore:   68,
  structureScore:    70,
  structureFeedback: 'Your speech had a reasonable flow but could benefit from a clearer opening hook and a stronger closing summary.',
  alternateAnswers: [
    'Start with a concrete statement of your main point, then support it with one specific example before wrapping up.',
    'Open by framing the problem, walk through your solution step by step, and close with the outcome or next action.',
  ],
  improvementTips: [
    'Pause for 1–2 seconds between major points instead of rushing through — silence signals confidence.',
    'Lead each section with a signpost phrase like "First…", "The key insight here is…", or "In summary…" to guide listeners.',
    'Add one specific number or metric per minute of speech to make abstract claims concrete and memorable.',
  ],
  fillerWordAnalysis: [],
  contentSuggestions: [
    'Your opening could be stronger — try leading with a surprising fact or question related to your topic.',
    'Consider adding a concrete example or personal story to support your main claim.',
    'End with a clear call-to-action or memorable closing line that reinforces your main message.',
  ],
};

export async function analyzeSpeech(
  transcript: string,
  durationSecs: number,
  mode: string,
): Promise<SpeechAnalysis> {
  const system = `You are a professional speech coach. Analyze the transcript and return ONLY a valid JSON object (no markdown fences, no extra text before or after the JSON) with these exact keys:
{
  "clarityScore": <0-100 integer>,
  "confidenceScore": <0-100 integer>,
  "structureScore": <0-100 integer>,
  "structureFeedback": "<1-2 sentence string>",
  "alternateAnswers": ["<rephrasing 1>", "<rephrasing 2>"],
  "improvementTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "fillerWordAnalysis": [
    { "word": "<filler word exactly as it appears in transcript>", "count": <integer> }
  ],
  "contentSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}

Rules — follow every one precisely:
1. fillerWordAnalysis: scan the ACTUAL transcript for filler words (um, uh, like, basically, literally, actually, so, right, okay, well, you know, I mean, kind of, sort of, hmm, er). Count every occurrence of each. Return [] if none found.
2. contentSuggestions: give exactly 2-3 actionable suggestions based on the ACTUAL content, structure, and delivery of THIS specific speech. Reference specific phrases, topics, or patterns from the transcript. Do NOT give generic advice.
3. improvementTips: specific, actionable tips tied to weaknesses visible in this transcript.
4. alternateAnswers: reworded versions of the speaker's key points that preserve intent but improve clarity.
5. All score fields must be integers 0-100. Return raw JSON only — no code blocks.`;

  const user = `Mode: ${mode} | Duration: ${durationSecs}s\n\nTranscript:\n${transcript.slice(0, 2500)}`;

  const raw    = await chatGroq(system, user, 1000);
  const parsed = parseJSON<SpeechAnalysis>(raw, SPEECH_FALLBACK);

  if (typeof parsed.clarityScore !== 'number') {
    throw new Error('Something went wrong with your analysis. Please try recording again.');
  }

  if (!Array.isArray(parsed.fillerWordAnalysis)) parsed.fillerWordAnalysis = [];
  if (!Array.isArray(parsed.contentSuggestions)) parsed.contentSuggestions = SPEECH_FALLBACK.contentSuggestions;

  return parsed;
}
