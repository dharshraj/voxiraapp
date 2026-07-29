/**
 * mockData.ts — stub functions for features that need a real backend endpoint
 * that doesn't exist yet. Replace each TODO stub with a real Supabase call
 * when the corresponding table/edge function is ready.
 *
 * All stubbed functions are in ONE place so they are easy to find and replace.
 */

// ── Weekly Report ─────────────────────────────────────────────────────────────
// TODO: replace with a Supabase query that aggregates sessions by week
export async function fetchWeeklyReport(userId: string) {
  // Returns the last 7 days of sessions, grouped by day
  // Real implementation: query speech_sessions WHERE created_at >= NOW()-7 days
  return null; // returns null → screen shows empty state
}

// ── Tone Analysis ─────────────────────────────────────────────────────────────
// TODO: replace with a Groq/OpenAI analysis call that returns tone breakdown
// for the most recent session transcript
export async function fetchToneAnalysis(transcript: string) {
  // Real implementation: call groq-analysis edge function with a tone prompt
  return null; // returns null → screen shows empty state
}

// ── Vocabulary Builder ────────────────────────────────────────────────────────
// TODO: replace with a Groq call that extracts vocabulary from session transcripts
export async function fetchVocabularyInsights(transcripts: string[]) {
  // Real implementation: call groq-analysis with vocabulary extraction prompt
  return null; // returns null → screen shows empty state
}

// ── Compare Sessions ──────────────────────────────────────────────────────────
// Derived entirely from sessionStore — no stub needed. Sessions are already
// available. This is here as documentation of the data shape used.
export type SessionComparison = {
  sessionA: any;
  sessionB: any;
};

// ── What's New ────────────────────────────────────────────────────────────────
// TODO: replace with a Supabase table or a static JSON file hosted somewhere
export const WHATS_NEW_ITEMS = [
  {
    version: '1.1.0',
    date: 'July 2026',
    items: [
      'Paginated analysis results — 9 dedicated result screens',
      'Speech Dashboard with composite score and WPM trends',
      'Daily Goals with real streak tracking',
      'Achievements with Coins rewards system',
    ],
  },
  {
    version: '1.0.0',
    date: 'June 2026',
    items: [
      'Initial release with Speech Analysis powered by AssemblyAI',
      'Groq AI feedback and improvement suggestions',
      'Supabase-backed session history and progress tracking',
    ],
  },
];
