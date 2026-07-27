/**
 * AI service — Speech Analysis (Groq), Writing Coach, Interview Prep (OpenAI proxy)
 *
 * Speech analysis requests (`analyzeSpeech`) are routed through the
 * `groq-analysis` Supabase Edge Function which calls Groq's API server-side
 * using llama-3.3-70b-versatile. The GROQ_API_KEY is NEVER in the client bundle.
 *
 * All other features (tone, style, interview) continue to use `openai-proxy`.
 *
 * Deploy steps (run once):
 *   supabase functions deploy groq-analysis
 *   supabase secrets set GROQ_API_KEY=gsk_...
 */

import { supabase } from './supabase';

// Only used by non-speech features (writing, interview) as a dev fallback.
// Speech analysis has NO client-side key fallback — always goes through the edge function.
const OPENAI_DIRECT_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY ?? '';
const OPENAI_BASE       = 'https://api.openai.com/v1';
const OPENAI_MODEL      = 'gpt-4o-mini';
const GROQ_MODEL        = 'llama-3.3-70b-versatile';
const TIMEOUT_MS        = 35_000;

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

export interface ToneResult {
  metrics:     Array<{ label: string; value: number; color: string; icon: string }>;
  suggestions: Array<{ text: string; type: 'positive' | 'improve' }>;
}

export interface StyleSuggestion {
  id:          string;
  category:    string;
  icon:        string;
  color:       string;
  title:       string;
  description: string;
  before:      string;
  after:       string;
  impact:      'high' | 'medium' | 'low';
  applied:     boolean;
}

export interface AnswerEvaluation {
  score:            number;
  strengths:        string[];
  weaknesses:       string[];
  modelAnswer:      string;
  followUpQuestion: string;
}

// ─── Core Chat Wrappers ───────────────────────────────────────────────────────

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

  console.log('[Groq] Invoking groq-analysis edge function, model:', GROQ_MODEL);

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

  // The edge function surfaced an error object
  if (error) {
    const msg = error?.message ?? 'groq-analysis edge function returned an error';
    console.error('[Groq] Edge function error:', msg);
    throw new Error(msg);
  }

  // The edge function itself returned a non-2xx and packaged it as { error: string }
  if (data?.error) {
    console.error('[Groq] API error from edge function:', data.error);
    throw new Error(data.error);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    console.error('[Groq] Unexpected response shape:', JSON.stringify(data)?.slice(0, 300));
    throw new Error('Groq returned an empty response — please try again.');
  }

  console.log('[Groq] Success — tokens:', data.usage?.total_tokens, '| preview:', text.slice(0, 80));
  return text as string;
}

/**
 * chat — routes through the openai-proxy Edge Function (used by writing/interview features).
 * Falls back to a direct OpenAI call if EXPO_PUBLIC_OPENAI_KEY is set (dev only).
 */
async function chat(system: string, user: string, maxTokens = 900): Promise<string> {
  const messages = [
    { role: 'system', content: system },
    { role: 'user',   content: user   },
  ];

  // Primary path: Supabase Edge Function proxy (key stays server-side)
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const { data, error } = await supabase.functions.invoke('openai-proxy', {
      body: { messages, model: OPENAI_MODEL, max_tokens: maxTokens, temperature: 0.6 },
    });

    clearTimeout(timeout);

    if (!error && data?.choices?.[0]?.message?.content) {
      const text = data.choices[0].message.content as string;
      console.log('[OpenAI/proxy] Tokens:', data.usage?.total_tokens, '| Preview:', text.slice(0, 80));
      return text;
    }

    if (!OPENAI_DIRECT_KEY) {
      throw new Error(error?.message ?? 'OpenAI proxy returned no content');
    }
    console.warn('[OpenAI/proxy] Edge Function error, falling back to direct call:', error?.message);
  } catch (proxyErr: any) {
    if (!OPENAI_DIRECT_KEY) throw proxyErr;
    console.warn('[OpenAI/proxy] Proxy unavailable, falling back to direct call:', proxyErr?.message);
  }

  // Fallback: direct OpenAI call (writing/interview features only, dev mode)
  console.log('[OpenAI/direct] Request →', OPENAI_MODEL);
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${OPENAI_DIRECT_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.6, max_tokens: maxTokens }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res!.ok) {
    const body = await res!.text().catch(() => '');
    console.error('[OpenAI/direct] HTTP error', res!.status, body.slice(0, 300));
    throw new Error(`OpenAI API error ${res!.status}: ${body.slice(0, 200)}`);
  }

  const json = await res!.json();
  const text = json.choices?.[0]?.message?.content ?? '';
  console.log('[OpenAI/direct] Tokens:', json.usage?.total_tokens, '| Preview:', text.slice(0, 80));
  return text;
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
    console.warn('[OpenAI] JSON parse failed — using fallback');
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
  // This prompt is sent to llama-3.3-70b-versatile via the groq-analysis edge function.
  // The GROQ_API_KEY is server-side only — never in the client bundle.
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

  // Use Groq (server-side) — throws with a user-readable message on any failure
  const raw    = await chatGroq(system, user, 1000);
  const parsed = parseJSON<SpeechAnalysis>(raw, SPEECH_FALLBACK);

  if (typeof parsed.clarityScore !== 'number') {
    throw new Error('The AI returned an unexpected format — please try recording again.');
  }

  // Guarantee new fields are always arrays even if the model omits them
  if (!Array.isArray(parsed.fillerWordAnalysis)) parsed.fillerWordAnalysis = [];
  if (!Array.isArray(parsed.contentSuggestions)) parsed.contentSuggestions = SPEECH_FALLBACK.contentSuggestions;

  return parsed;
}

// ─── Tone Analysis ────────────────────────────────────────────────────────────

const TONE_FALLBACK: ToneResult = {
  metrics: [
    { label: 'Confidence',     value: 70, color: '#6C5CE7', icon: 'shield-checkmark-outline' },
    { label: 'Formality',      value: 65, color: '#00CEC9', icon: 'business-outline'         },
    { label: 'Friendliness',   value: 75, color: '#FDCB6E', icon: 'heart-outline'            },
    { label: 'Clarity',        value: 80, color: '#00B894', icon: 'eye-outline'              },
    { label: 'Persuasiveness', value: 55, color: '#E17055', icon: 'megaphone-outline'        },
    { label: 'Empathy',        value: 68, color: '#74B9FF', icon: 'hand-left-outline'        },
  ],
  suggestions: [
    { text: 'Your writing maintains a consistent tone throughout.',          type: 'positive' },
    { text: 'Consider adding specific examples to strengthen key claims.',   type: 'improve'  },
    { text: 'Sentence structure is clear and easy for readers to follow.',  type: 'positive' },
    { text: 'Varying sentence length would create better rhythm.',          type: 'improve'  },
  ],
};

export async function analyzeTone(text: string): Promise<ToneResult> {
  const system = `You are a writing tone analyzer. Analyze the text and return ONLY a JSON object with exactly these keys (no markdown):
{
  "metrics": [
    { "label": "Confidence",     "value": <0-100>, "color": "#6C5CE7", "icon": "shield-checkmark-outline" },
    { "label": "Formality",      "value": <0-100>, "color": "#00CEC9", "icon": "business-outline" },
    { "label": "Friendliness",   "value": <0-100>, "color": "#FDCB6E", "icon": "heart-outline" },
    { "label": "Clarity",        "value": <0-100>, "color": "#00B894", "icon": "eye-outline" },
    { "label": "Persuasiveness", "value": <0-100>, "color": "#E17055", "icon": "megaphone-outline" },
    { "label": "Empathy",        "value": <0-100>, "color": "#74B9FF", "icon": "hand-left-outline" }
  ],
  "suggestions": [
    { "text": "<insight 1>", "type": "positive" },
    { "text": "<insight 2>", "type": "improve" },
    { "text": "<insight 3>", "type": "positive" },
    { "text": "<insight 4>", "type": "improve" }
  ]
}
Keep the exact color and icon values shown.`;

  const user = `Analyze the tone of this text:\n\n${text.slice(0, 3000)}`;

  try {
    const raw    = await chat(system, user, 700);
    const parsed = parseJSON<ToneResult>(raw, TONE_FALLBACK);
    if (!Array.isArray(parsed.metrics) || parsed.metrics.length < 6) return TONE_FALLBACK;
    return parsed;
  } catch (e: any) {
    console.error('[OpenAI] analyzeTone error:', e.message);
    return TONE_FALLBACK;
  }
}

// ─── Style Suggestions ────────────────────────────────────────────────────────

const STYLE_FALLBACK: StyleSuggestion[] = [
  { id:'1', category:'Active Voice',  icon:'flash-outline',    color:'#6C5CE7', title:'Switch to active voice',  impact:'high',   applied:false, description:'Passive voice weakens your message.',    before:'The report was written by the team.', after:'The team wrote the report.' },
  { id:'2', category:'Conciseness',   icon:'contract-outline', color:'#E17055', title:'Remove filler phrases',   impact:'high',   applied:false, description:'Cut phrases that add length without meaning.', before:'It is important to note that results improved.', after:'Results improved.' },
  { id:'3', category:'Word Choice',   icon:'text-outline',     color:'#FDCB6E', title:'Use stronger verbs',      impact:'medium', applied:false, description:'Replace weak verbs with specific alternatives.', before:'We need to get better results.', after:'We need to achieve stronger results.' },
  { id:'4', category:'Transitions',   icon:'link-outline',     color:'#74B9FF', title:'Add transitional phrases',impact:'low',    applied:false, description:'Connect paragraphs with clear transitions.', before:'Sales grew. Satisfaction dropped.', after:'Sales grew. However, satisfaction dropped.' },
];

export async function generateStyleSuggestions(text: string): Promise<StyleSuggestion[]> {
  const system = `You are a writing style coach. Analyze the text and return ONLY a JSON array of exactly 4 style suggestions (no markdown). Each must have these exact keys:
[{ "id":"1","category":"...","icon":"<Ionicons name>","color":"<hex>","title":"...","description":"...","before":"...","after":"...","impact":"high|medium|low","applied":false }]
Use colors in order: "#6C5CE7","#E17055","#FDCB6E","#74B9FF". Base all suggestions on the actual text.`;

  const user = `Suggest style improvements for:\n\n${text.slice(0, 3000)}`;

  try {
    const raw    = await chat(system, user, 900);
    const parsed = parseJSON<StyleSuggestion[]>(raw, STYLE_FALLBACK);
    if (!Array.isArray(parsed)) return STYLE_FALLBACK;
    return parsed.slice(0, 4).map((s, i) => ({ ...s, id: String(i + 1), applied: false }));
  } catch (e: any) {
    console.error('[OpenAI] generateStyleSuggestions error:', e.message);
    return STYLE_FALLBACK;
  }
}

// ─── Rewrite ──────────────────────────────────────────────────────────────────

const STYLE_DESCRIPTIONS: Record<string, string> = {
  professional: 'formal, polished business tone with precise language',
  casual:       'warm, conversational — like explaining to a friend',
  concise:      'as short as possible — cut every unnecessary word',
  elaborate:    'more detailed, expanding on context and nuance',
  persuasive:   'compelling — strong verbs, rhetorical techniques, emotional resonance',
  academic:     'scholarly and precise — formal vocabulary, structured argument',
};

export async function rewriteText(text: string, style: string): Promise<string> {
  const desc   = STYLE_DESCRIPTIONS[style] ?? style;
  const system = `You are an expert writing assistant. Rewrite the provided text in a ${desc} style. Preserve core meaning but significantly change tone. Return ONLY the rewritten text — no explanations, labels, or quotes.`;
  const raw    = await chat(system, text.slice(0, 3000), 600);
  return raw.trim();
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export async function generateInterviewQuestions(
  role: string,
  type: string,
  difficulty: string,
  count: number,
): Promise<string[]> {
  const diffDesc = difficulty === 'easy' ? 'entry-level, straightforward' : difficulty === 'medium' ? 'mid-level, requires real experience' : 'senior-level, strategic thinking required';
  const system   = `You are an expert hiring manager. Generate realistic interview questions. Return ONLY a JSON array of exactly ${count} question strings (no markdown, no numbering).
Rules: behavioral → STAR method; technical → practical role knowledge; situational → hypothetical work scenarios; mixed → all types; ${difficulty} difficulty: ${diffDesc}`;
  const user     = `Generate ${count} ${difficulty}-difficulty ${type} interview questions for: ${role}`;

  const fallback = Array.from({ length: count }, (_, i) => [
    'Tell me about yourself and your professional background.',
    'Describe your greatest professional achievement.',
    'Tell me about a time you faced a major challenge and how you overcame it.',
    'Describe a situation where you had to work under pressure.',
    'Tell me about a time you demonstrated leadership.',
    'Where do you see yourself in 5 years?',
    'What are your greatest strengths and areas for growth?',
    'Describe a time you had to work with a difficult team member.',
    'Tell me about a project you\'re most proud of.',
    'Why do you want this role?',
    'How do you prioritize when you have multiple deadlines?',
    'Describe a time you had to learn something new quickly.',
    'Tell me about a mistake you made and what you learned.',
    'How do you handle feedback and criticism?',
  ][i % 14]);

  try {
    const raw       = await chat(system, user, 700);
    const questions = parseJSON<string[]>(raw, fallback);
    if (!Array.isArray(questions)) return fallback;
    return questions.slice(0, count);
  } catch (e: any) {
    console.error('[OpenAI] generateInterviewQuestions error:', e.message);
    return fallback;
  }
}

// ─── Answer Evaluation ────────────────────────────────────────────────────────

const EVAL_FALLBACK: AnswerEvaluation = {
  score:            70,
  strengths:        ['Addressed the question directly', 'Used a relevant example'],
  weaknesses:       ['Add specific metrics or numbers', 'STAR structure could be clearer'],
  modelAnswer:      'A strong answer includes a specific Situation, Task, concrete Actions, and measurable Results.',
  followUpQuestion: 'Can you quantify the impact of your actions in that situation?',
};

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  role: string,
  difficulty: string,
): Promise<AnswerEvaluation> {
  const system = `You are an expert interview coach. Return ONLY a JSON object (no markdown):
{
  "score": <0-100 integer>,
  "strengths": ["<strength 1>","<strength 2>"],
  "weaknesses": ["<improvement 1>","<improvement 2>"],
  "modelAnswer": "<concise 2-4 sentence example>",
  "followUpQuestion": "<realistic follow-up>"
}
Score on: relevance, STAR structure, specificity, role-fit.`;

  const user = `Role: ${role} | Difficulty: ${difficulty}
Question: ${question}
Answer: ${answer?.trim() || '(No answer provided)'}`;

  try {
    const raw    = await chat(system, user, 600);
    const parsed = parseJSON<AnswerEvaluation>(raw, EVAL_FALLBACK);
    if (typeof parsed.score !== 'number') return EVAL_FALLBACK;
    parsed.score = Math.max(0, Math.min(100, parsed.score));
    return parsed;
  } catch (e: any) {
    console.error('[OpenAI] evaluateInterviewAnswer error:', e.message);
    return { ...EVAL_FALLBACK, score: Math.floor(60 + Math.random() * 25) };
  }
}

export function hasOpenAIKey(): boolean {
  return !!OPENAI_DIRECT_KEY;
}
