/**
 * OpenAI service — Speech Analysis, Writing Coach, Interview Prep
 * Requires EXPO_PUBLIC_OPENAI_KEY in .env
 */

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY ?? '';
const BASE = 'https://api.openai.com/v1';
const MODEL = 'gpt-4o-mini';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface SpeechAnalysis {
  clarityScore:       number;
  confidenceScore:    number;
  structureScore:     number;
  structureFeedback:  string;
  alternateAnswers:   string[];  // 1-2 improved rephrasings
  improvementTips:    string[];  // 2-3 specific actionable tips
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
  score:              number;   // 0-100
  strengths:          string[]; // 2 items
  weaknesses:         string[]; // 2 items
  modelAnswer:        string;
  followUpQuestion:   string;
}

// ─── Core Chat Wrapper ────────────────────────────────────────────────────────

async function chat(system: string, user: string, maxTokens = 900): Promise<string> {
  if (!OPENAI_KEY) {
    console.warn('[OpenAI] EXPO_PUBLIC_OPENAI_KEY is not set');
    throw new Error('OpenAI API key not configured — add EXPO_PUBLIC_OPENAI_KEY to .env');
  }
  console.log('[OpenAI] Request →', MODEL, '| system len:', system.length, '| user len:', user.length);

  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system',  content: system },
        { role: 'user',    content: user   },
      ],
      temperature: 0.6,
      max_tokens:  maxTokens,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[OpenAI] HTTP error', res.status, body.slice(0, 300));
    throw new Error(`OpenAI API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  console.log('[OpenAI] Tokens used:', data.usage?.total_tokens, '| Preview:', text.slice(0, 100));
  return text;
}

// Extracts a JSON value (object or array) from a possibly-markdown-wrapped string.
function parseJSON<T>(raw: string, fallback: T): T {
  try {
    // Strip markdown code fences
    const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(stripped) as T;
  } catch {
    // Try to find the first { or [ block
    const objMatch = raw.match(/(\{[\s\S]*\})/);
    const arrMatch = raw.match(/(\[[\s\S]*\])/);
    const match = objMatch?.[1] ?? arrMatch?.[1];
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
};

export async function analyzeSpeech(
  transcript: string,
  durationSecs: number,
  mode: string,
): Promise<SpeechAnalysis> {
  const system = `You are a professional speech coach. Analyze the transcript and return ONLY a JSON object (no markdown, no extra text) with these exact keys:
{
  "clarityScore": <0-100 integer, how clear and understandable>,
  "confidenceScore": <0-100 integer, how confident the word choice sounds>,
  "structureScore": <0-100 integer, how well-organized: intro/body/conclusion>,
  "structureFeedback": <1-2 sentence string about overall structure>,
  "alternateAnswers": [<string: improved rephrasing 1>, <string: improved rephrasing 2>],
  "improvementTips": [<string: specific tip 1>, <string: specific tip 2>, <string: specific tip 3>]
}
Tips must be specific (not generic). Alternate answers must preserve the speaker's intent.`;

  const user = `Mode: ${mode} | Duration: ${durationSecs}s\n\nTranscript:\n${transcript.slice(0, 2500)}`;

  // Let errors propagate — AnalyzingScreen shows error UI when this throws
  const raw = await chat(system, user, 800);
  const parsed = parseJSON<SpeechAnalysis>(raw, SPEECH_FALLBACK);
  if (typeof parsed.clarityScore !== 'number') {
    throw new Error('AI returned an invalid response — could not parse speech scores');
  }
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
    { text: 'Your writing maintains a consistent tone throughout the piece.',        type: 'positive' },
    { text: 'Consider adding specific examples to strengthen key claims.',            type: 'improve'  },
    { text: 'The sentence structure is clear and easy for readers to follow.',       type: 'positive' },
    { text: 'Varying sentence length would create better rhythm and engagement.',    type: 'improve'  },
  ],
};

export async function analyzeTone(text: string): Promise<ToneResult> {
  const system = `You are a writing tone analyzer. Analyze the text and return ONLY a JSON object with exactly these keys (no markdown, no extra text):
{
  "metrics": [
    { "label": "Confidence",     "value": <0-100>, "color": "#6C5CE7", "icon": "shield-checkmark-outline" },
    { "label": "Formality",      "value": <0-100>, "color": "#00CEC9", "icon": "business-outline"         },
    { "label": "Friendliness",   "value": <0-100>, "color": "#FDCB6E", "icon": "heart-outline"            },
    { "label": "Clarity",        "value": <0-100>, "color": "#00B894", "icon": "eye-outline"              },
    { "label": "Persuasiveness", "value": <0-100>, "color": "#E17055", "icon": "megaphone-outline"        },
    { "label": "Empathy",        "value": <0-100>, "color": "#74B9FF", "icon": "hand-left-outline"        }
  ],
  "suggestions": [
    { "text": "<specific insight 1>", "type": "positive" },
    { "text": "<specific insight 2>", "type": "improve"  },
    { "text": "<specific insight 3>", "type": "positive" },
    { "text": "<specific insight 4>", "type": "improve"  }
  ]
}
Base values on actual content analysis. Keep the exact color and icon values shown.`;

  const user = `Analyze the tone of this text:\n\n${text.slice(0, 3000)}`;

  try {
    const raw = await chat(system, user, 700);
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
  { id: '1', category: 'Active Voice',    icon: 'flash-outline',         color: '#6C5CE7',
    title: 'Switch to active voice', impact: 'high', applied: false,
    description: 'Passive voice weakens your message. Restructure for directness.',
    before: 'The report was written by the team.', after: 'The team wrote the report.' },
  { id: '2', category: 'Conciseness',     icon: 'contract-outline',      color: '#E17055',
    title: 'Remove filler phrases', impact: 'high', applied: false,
    description: 'Cut phrases that add length without meaning.',
    before: 'It is important to note that results improved.', after: 'Results improved.' },
  { id: '3', category: 'Word Choice',     icon: 'text-outline',          color: '#FDCB6E',
    title: 'Use stronger verbs', impact: 'medium', applied: false,
    description: 'Replace weak verbs with more specific alternatives.',
    before: 'We need to get better results.', after: 'We need to achieve stronger results.' },
  { id: '4', category: 'Transitions',     icon: 'link-outline',          color: '#74B9FF',
    title: 'Add transitional phrases', impact: 'low', applied: false,
    description: 'Connect paragraphs with clear transitions.',
    before: 'Sales grew. Satisfaction dropped.', after: 'Sales grew. However, satisfaction dropped.' },
];

export async function generateStyleSuggestions(text: string): Promise<StyleSuggestion[]> {
  const system = `You are a writing style coach. Analyze the text and return ONLY a JSON array of exactly 4 style suggestions (no markdown, no extra text). Each suggestion must have these exact keys:
[
  {
    "id": "1",
    "category": "<e.g. Active Voice, Conciseness, Word Choice, Sentence Variety, Transitions>",
    "icon": "<Ionicons icon name e.g. flash-outline>",
    "color": "<hex color>",
    "title": "<brief title>",
    "description": "<specific description referencing the actual text>",
    "before": "<problematic phrase or sentence from or similar to the text>",
    "after": "<improved version>",
    "impact": "<high|medium|low>",
    "applied": false
  }
]
Use these colors in order: "#6C5CE7", "#E17055", "#FDCB6E", "#74B9FF". Base all suggestions on the actual text.`;

  const user = `Suggest style improvements for this text:\n\n${text.slice(0, 3000)}`;

  try {
    const raw = await chat(system, user, 900);
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
  professional: 'formal, polished business tone with precise language and professional vocabulary',
  casual:       'warm, conversational and approachable — like explaining to a friend',
  concise:      'as short as possible — cut every unnecessary word while keeping all key points',
  elaborate:    'more detailed, expanding on context, examples, and nuance',
  persuasive:   'compelling and convincing — use rhetorical techniques, strong verbs, emotional resonance',
  academic:     'scholarly and precise — formal vocabulary, structured argument, citation-ready style',
};

export async function rewriteText(text: string, style: string): Promise<string> {
  const desc = STYLE_DESCRIPTIONS[style] ?? style;
  const system = `You are an expert writing assistant. Rewrite the provided text in a ${desc} style. Preserve the core meaning and key points but significantly change the tone. Return ONLY the rewritten text — no explanations, no labels, no quotes.`;

  const user = text.slice(0, 3000);

  const raw = await chat(system, user, 600);
  return raw.trim();
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export async function generateInterviewQuestions(
  role: string,
  type: string,
  difficulty: string,
  count: number,
): Promise<string[]> {
  const system = `You are an expert hiring manager. Generate realistic interview questions for the role. Return ONLY a JSON array of exactly ${count} question strings (no markdown, no numbering, no extra text).
Rules:
- behavioral: use STAR-method contexts (tell me about a time…)
- technical: test practical role-specific knowledge
- situational: present realistic hypothetical work scenarios
- mixed: combine all three types
- ${difficulty} difficulty: ${difficulty === 'easy' ? 'entry-level, straightforward' : difficulty === 'medium' ? 'mid-level, requires real experience' : 'senior-level, strategic thinking required'}`;

  const user = `Generate ${count} ${difficulty}-difficulty ${type} interview questions for: ${role}`;

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
    const raw = await chat(system, user, 700);
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
  strengths:        ['Addressed the question directly', 'Used a relevant example to illustrate your point'],
  weaknesses:       ['Could add specific metrics or numbers to quantify impact', 'STAR structure could be made clearer'],
  modelAnswer:      'A strong answer includes a specific Situation, the Task you faced, concrete Actions you took, and measurable Results achieved.',
  followUpQuestion: 'Can you quantify the impact of your actions in that situation?',
};

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  role: string,
  difficulty: string,
): Promise<AnswerEvaluation> {
  const system = `You are an expert interview coach evaluating a candidate's response. Return ONLY a JSON object with these exact keys (no markdown, no extra text):
{
  "score": <0-100 integer>,
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "weaknesses": ["<specific improvement 1>", "<specific improvement 2>"],
  "modelAnswer": "<concise 2-4 sentence example of an excellent answer>",
  "followUpQuestion": "<realistic follow-up the interviewer would ask>"
}
Be specific and constructive. Score based on: relevance, structure (STAR), specificity, and role-fit.`;

  const user = `Role: ${role} | Difficulty: ${difficulty}
Question: ${question}
Candidate's Answer: ${answer?.trim() || '(No answer provided)'}`;

  try {
    const raw = await chat(system, user, 600);
    const parsed = parseJSON<AnswerEvaluation>(raw, EVAL_FALLBACK);
    if (typeof parsed.score !== 'number') return EVAL_FALLBACK;
    parsed.score = Math.max(0, Math.min(100, parsed.score));
    return parsed;
  } catch (e: any) {
    console.error('[OpenAI] evaluateInterviewAnswer error:', e.message);
    return { ...EVAL_FALLBACK, score: Math.floor(60 + Math.random() * 25) };
  }
}

// ─── Key Check Helper ─────────────────────────────────────────────────────────

export function hasOpenAIKey(): boolean {
  return !!OPENAI_KEY;
}
